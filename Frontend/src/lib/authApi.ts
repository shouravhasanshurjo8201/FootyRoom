import { ApiError, fetcher } from '@/lib/api';
import type { ApiEnvelope, User } from '@/types';

export interface TokenResponse {
    expiresIn: number;
}

export interface LoginResponse extends TokenResponse {
    user: User;
}

export interface AuthenticatedUserResponse extends TokenResponse {
    user: User;
}

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
    const res = await fetcher<ApiEnvelope<LoginResponse>>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
    });
    return { expiresIn: res.data.expiresIn };
}

let inflightRefresh: Promise<TokenResponse> | null = null;

export function refreshToken(): Promise<TokenResponse> {
    if (!inflightRefresh) {
        const requestRefresh = () => fetcher<ApiEnvelope<TokenResponse>>('/auth/refresh', {
            method: 'POST',
        });
        const request = async (): Promise<ApiEnvelope<TokenResponse>> => {
            if (typeof navigator === 'undefined' || !navigator.locks) {
                return requestRefresh();
            }
            return await navigator.locks.request(
                'footyroom-auth-refresh',
                async () => await requestRefresh()
            );
        };
        inflightRefresh = request()
            .then((res) => ({ expiresIn: res.data.expiresIn }))
            .finally(() => {
                inflightRefresh = null;
            });
    }
    return inflightRefresh;
}

export async function getMe(): Promise<AuthenticatedUserResponse | null> {
    try {
        const res = await fetcher<ApiEnvelope<User>>('/auth/me');
        return res.data ? { user: res.data, expiresIn: res.expiresIn ?? 0 } : null;
    } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) {
            console.error('Get Me Error:', error);
        }
        return null;
    }
}

export async function logout(): Promise<void> {
    await fetcher<unknown>('/auth/logout', { method: 'POST' });
}
