'use server';

import { fetcher } from '@/lib/api';
import type { Brand, Category } from '@/types';
import { ApiEnvelope } from '@/types/auth';



function extractList<T>(res: unknown, key: string): T[] {
    if (Array.isArray(res)) return res as T[];
    const obj = res as (ApiEnvelope<T[]> & Record<string, unknown>) | null;
    if (Array.isArray(obj?.[key])) return obj[key] as T[];
    if (Array.isArray(obj?.data)) return obj.data;
    return [];
}

export async function getBrands(): Promise<Brand[]> {
    try {
        const res = await fetcher<unknown>('/brands');
        return extractList<Brand>(res, 'brands');
    } catch (error) {
        console.error('Get Brands Error:', error);
        return [];
    }
}

export async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetcher<unknown>('/categories');
        return extractList<Category>(res, 'categories');
    } catch (error) {
        console.error('Get Categories Error:', error);
        return [];
    }
}