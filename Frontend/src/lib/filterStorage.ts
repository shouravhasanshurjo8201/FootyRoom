import type { Filters } from '@/types';

const FILTER_STORAGE_KEY = 'product_filters';

export function readFilters(): Filters | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<Filters>;
        const filters: Filters = {
            brand: typeof parsed.brand === 'string' ? parsed.brand : '',
            category: typeof parsed.category === 'string' ? parsed.category : '',
            price: typeof parsed.price === 'string' ? parsed.price : '',
            sort: typeof parsed.sort === 'string' ? parsed.sort : '',
        };

        return Object.values(filters).some(Boolean) ? filters : null;
    } catch {
        return null;
    }
}

export function saveFilters(filters: Filters): void {
    if (typeof window === 'undefined') return;

    try {
        if (Object.values(filters).some(Boolean)) {
            window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
        } else {
            window.localStorage.removeItem(FILTER_STORAGE_KEY);
        }
    } catch {
        // localStorage block thakle ignore
    }
}