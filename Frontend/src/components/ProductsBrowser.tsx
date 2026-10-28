'use client';

import { useRef, useState, useTransition } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import Pagination from '@/components/Pagination';
import ProductSkeleton from '@/components/ProductSkeleton';
import {
    getProducts,
    searchProducts,
    filterProducts,
} from '@/actions/productActions';
import type { Product, Filters, ProductsBrowserProps, FetchParams } from '@/types';

const DEBOUNCE_MS = 800;



const EMPTY_FILTERS: Filters = { brand: '', category: '', price: '', sort: '' };

export default function ProductsBrowser({
    initialProducts,
    initialTotalPages,
    brands,
    categories,
    limit,
}: ProductsBrowserProps) {
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const [isPending, startTransition] = useTransition();

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const load = (params: FetchParams) => {
        const requestId = ++requestIdRef.current;

        startTransition(async () => {
            try {
                const { query: q, brand, category, price, sort, page: p } = params;
                const hasFilter = Boolean(brand || category || price || sort);

                let res;
                if (q) {
                    const [minPrice, maxPrice] = price ? price.split('-') : ['', ''];
                    res = await searchProducts(q, p, limit, {
                        brand,
                        category,
                        minPrice,
                        maxPrice,
                        sort,
                    });
                } else if (hasFilter) {
                    const [minPrice, maxPrice] = price ? price.split('-') : ['', ''];
                    res = await filterProducts({
                        brand,
                        category,
                        minPrice,
                        maxPrice,
                        sort,
                        page: p,
                        limit,
                    });
                } else {
                    res = await getProducts(p, limit);
                }

                if (requestId !== requestIdRef.current) return;

                setProducts(Array.isArray(res?.products) ? res.products : []);
                setTotalPages(res?.totalPages || 1);
                setPage(p);
                setActiveQuery(q);
            } catch (error) {
                if (requestId !== requestIdRef.current) return;
                console.error('Load products error:', error);
                setProducts([]);
                setTotalPages(1);
            }
        });
    };

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleSearch = (value: string) => {
        setQuery(value);
        clearTimer();

        const trimmed = value.trim();

        if (!trimmed) {
            load({ query: '', ...filters, page: 1 });
            return;
        }

        timerRef.current = setTimeout(
            () => load({ query: trimmed, ...filters, page: 1 }),
            DEBOUNCE_MS
        );
    };

    const handleSearchNow = (value: string) => {
        clearTimer();
        const trimmed = value.trim();
        setQuery(value);
        load({ query: trimmed, ...filters, page: 1 });
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        clearTimer();
        const next = { ...filters, [key]: value };
        setFilters(next);
        setQuery('');
        load({ query: '', ...next, page: 1 });
    };

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages) return;
        load({ query: activeQuery, ...filters, page: nextPage });
    };

    return (
        <>
            <Navbar
                searchQuery={query}
                onSearch={handleSearch}
                onSearchNow={handleSearchNow}
            />

            <div className="py-6 grid grid-cols-1 md:grid-cols-4 gap-8">

                <div className="order-1 md:order-2 md:col-span-1">
                    <FilterSidebar
                        brands={brands}
                        categories={categories}
                        selectedBrand={filters.brand}
                        setSelectedBrand={(v) => handleFilterChange('brand', v)}
                        selectedCategory={filters.category}
                        setSelectedCategory={(v) => handleFilterChange('category', v)}
                        selectedPrice={filters.price}
                        setSelectedPrice={(v) => handleFilterChange('price', v)}
                        sort={filters.sort}
                        setSort={(v) => handleFilterChange('sort', v)}
                    />
                </div>

                <div className="order-2 md:order-1 md:col-span-3 flex flex-col justify-between">
                    {isPending ? (
                        <ProductSkeleton />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))
                                ) : (
                                    <p className="col-span-full text-center py-10 text-gray-500 font-mono">
                                        No products found.
                                    </p>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </div>

            </div>
        </>
    );
}