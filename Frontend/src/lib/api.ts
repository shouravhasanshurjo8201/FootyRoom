const BASE_URL =
    typeof window === 'undefined'
        ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:8000/api/v1'
        : '/api/v1';

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export async function fetcher<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const { headers, ...rest } = options;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...rest,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(headers as Record<string, string> | undefined),
        },
    });

    if (!res.ok) {
        let body: unknown;
        try {
            body = await res.json();
        } catch {
            body = undefined;
        }
        throw new ApiError(
            `API Error ${res.status}: ${res.statusText}`,
            res.status,
            body
        );
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
}