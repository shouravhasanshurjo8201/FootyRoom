'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
    getMe,
    loginWithGoogle,
    logout as apiLogout,
    refreshToken,
    type TokenResponse,
} from '@/lib/authApi';
import type { User } from '@/types';
import { AuthContextValue } from '@/types/auth';

const REFRESH_BEFORE_SECONDS = 30;
const MIN_DELAY_MS = 5_000;

const AuthContext = createContext<AuthContextValue | null>(null);

function getDelayMs(res: TokenResponse): number {
    const tokenLifeSeconds = res.expiresIn;
    const refreshDelaySeconds = tokenLifeSeconds <= REFRESH_BEFORE_SECONDS
        ? tokenLifeSeconds / 2
        : tokenLifeSeconds - REFRESH_BEFORE_SECONDS;
    return Math.max(refreshDelaySeconds * 1000, MIN_DELAY_MS);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const started = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshAtRef = useRef<number>(0);
    const refreshingRef = useRef(false);
    const scheduleRefreshRef = useRef<(res: TokenResponse) => void>(() => undefined);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const scheduleRefresh = useCallback(
        (res: TokenResponse) => {
            clearTimer();
            const delay = getDelayMs(res);
            refreshAtRef.current = Date.now() + delay;

            timerRef.current = setTimeout(async () => {
                if (refreshingRef.current) return;
                refreshingRef.current = true;
                try {
                    const next = await refreshToken();
                    scheduleRefreshRef.current(next);
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    clearTimer();
                    setUser(null);
                } finally {
                    refreshingRef.current = false;
                }
            }, delay);
        },
        [clearTimer]
    );

    useEffect(() => {
        scheduleRefreshRef.current = scheduleRefresh;
    }, [scheduleRefresh]);

    useEffect(() => {
        if (status === 'loading' || started.current) return;
        started.current = true;

        const idToken = session?.idToken;

        (async () => {
            try {
                let tokenRes: TokenResponse | undefined;

                if (idToken) {
                    tokenRes = await loginWithGoogle(idToken);
                    await signOut({ redirect: false });
                }
                const me = await getMe();
                setUser(me?.user ?? null);

                if (me) {
                    scheduleRefresh(tokenRes ?? me);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [status, session?.idToken, scheduleRefresh]);

    useEffect(() => {
        if (!user) return;

        const onVisible = async () => {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() < refreshAtRef.current) return;
            if (refreshingRef.current) return;

            refreshingRef.current = true;
            try {
                const next = await refreshToken();
                scheduleRefresh(next);
            } catch (error) {
                console.error('Token refresh failed:', error);
                clearTimer();
                setUser(null);
            } finally {
                refreshingRef.current = false;
            }
        };

        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [user, scheduleRefresh, clearTimer]);

    useEffect(() => clearTimer, [clearTimer]);

    const logout = useCallback(async () => {
        await apiLogout();
        clearTimer();
        setUser(null);
    }, [clearTimer]);

    const value = useMemo(
        () => ({ user, loading, logout }),
        [user, loading, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return ctx;
}