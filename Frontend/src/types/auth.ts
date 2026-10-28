import 'next-auth';
import 'next-auth/jwt';
import { User } from '.';

declare module 'next-auth' {
    interface Session {
        idToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        idToken?: string;
    }
}


export interface AuthContextValue {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

export interface ApiEnvelope<T> {
    data?: T;
}