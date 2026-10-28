'use server';

import { fetcher } from '@/lib/api';
import type { Product, ProductsResponse } from '@/types';

export interface ProductQueryFilters {
    brand?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
    if (!isRecord(value) || !isRecord(value.brand)) return false;
    return typeof value._id === 'string'
        && typeof value.productName === 'string'
        && typeof value.price === 'number'
        && Number.isFinite(value.price)
        && typeof value.brand._id === 'string'
        && typeof value.brand.name === 'string'
        && typeof value.brand.slug === 'string';
}

function parseProductResponse(response: unknown): ProductsResponse {
    const envelope = isRecord(response) ? response : undefined;
    const data = envelope && 'data' in envelope ? envelope.data : response;
    const result = isRecord(data) ? data : undefined;
    const pagination = result && isRecord(result.pagination) ? result.pagination : undefined;
    const productData = Array.isArray(data) ? data : result?.products;

    if (!Array.isArray(productData) || !productData.every(isProduct)) {
        throw new Error('Invalid product response received from API');
    }

    const products: Product[] = productData;

    const totalPages = pagination?.totalPages ?? result?.totalPages;
    const total = pagination?.totalProducts ?? result?.total;
    const currentPage = pagination?.currentPage ?? result?.currentPage;

    return {
        products,
        total: typeof total === 'number' && Number.isFinite(total) ? total : products.length,
        totalPages: typeof totalPages === 'number' && Number.isFinite(totalPages) ? totalPages : 1,
        currentPage: typeof currentPage === 'number' && Number.isFinite(currentPage) ? currentPage : 1,
    };
}

export async function getProducts(page: number = 1, limit: number = 9): Promise<ProductsResponse> {
    try {
        const res = await fetcher<unknown>(`/products?page=${page}&limit=${limit}`);
        return parseProductResponse(res);
    } catch (error) {
        console.error('Get Products Error:', error);
        return { products: [], total: 0, totalPages: 1, currentPage: 1 };
    }
}

export async function searchProducts(
    search: string,
    page: number = 1,
    limit: number = 9,
    filters: ProductQueryFilters = {}
): Promise<ProductsResponse> {
    try {
        const res = await fetcher<unknown>(`/products/search?${makeQuery({
            ...filters,
            query: search,
            page,
            limit,
        })}`);
        return parseProductResponse(res);
    } catch (error) {
        console.error('Search Error:', error);
        return { products: [], total: 0, totalPages: 1, currentPage: 1 };
    }
}

export async function filterProducts(
    params: ProductQueryFilters & { page?: number; limit?: number }
): Promise<ProductsResponse> {
    try {
        const res = await fetcher<unknown>(`/products/filter?${makeQuery(params)}`);
        return parseProductResponse(res);
    } catch (error) {
        console.error('Filter Error:', error);
        return { products: [], total: 0, totalPages: 1, currentPage: 1 };
    }
}

function makeQuery(params: ProductQueryFilters & { query?: string; page?: number; limit?: number }): string {
    const query = new URLSearchParams();
    if (params.query) query.set('query', params.query);
    if (params.brand) query.set('brand', params.brand);
    if (params.category) query.set('category', params.category);
    if (params.minPrice) query.set('minPrice', params.minPrice);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    if (params.sort) query.set('sort', params.sort);
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 9));
    return query.toString();
}