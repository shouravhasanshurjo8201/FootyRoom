'use client';

import { useState } from 'react';
import type { DropdownProps, FilterSidebarProps, Option } from '@/types';

const FILTER_STORAGE_KEY = 'product_filters';

type SavedFilters = {
    brand: string;
    category: string;
    price: string;
    sort: string;
};

const DEFAULT_FILTERS: SavedFilters = {
    brand: '',
    category: '',
    price: '',
    sort: '',
};

function saveFilters(filters: SavedFilters): void {
    if (typeof window === 'undefined') return;

    try {
        const hasActiveFilters = Object.values(filters).some(Boolean);

        if (hasActiveFilters) {
            window.localStorage.setItem(
                FILTER_STORAGE_KEY,
                JSON.stringify(filters)
            );
        } else {
            window.localStorage.removeItem(FILTER_STORAGE_KEY);
        }
    } catch {
        // Ignore localStorage errors.
    }
}

function Dropdown({
    id,
    value,
    options,
    isOpen,
    onToggle,
    onClose,
    onSelect,
}: DropdownProps) {
    const selected =
        options.find((option) => option.value === value) ?? options[0];

    return (
        <div className="relative">
            {isOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => onToggle(id)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        onClose();
                    }
                }}
                className={`relative z-20 flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-xs font-mono text-gray-700 shadow-sm focus:outline-none sm:text-sm ${isOpen
                    ? 'border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
            >
                <span className="truncate">{selected?.label}</span>

                <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {options.map((option) => {
                        const active = option.value === value;

                        return (
                            <li
                                key={option.value}
                                role="option"
                                aria-selected={active}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelect(option.value);
                                        onClose();
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs font-mono transition sm:text-sm ${active
                                        ? 'bg-emerald-50 font-semibold text-emerald-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function FilterSidebar({
    brands = [],
    categories = [],
    filters,
    onFilterChange,
    onReset,
}: FilterSidebarProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const safeBrands = Array.isArray(brands) ? brands : [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    const brandOptions: Option[] = [
        { value: '', label: 'All Brands' },
        ...safeBrands.map((brand) => ({
            value: brand._id || brand.name,
            label: brand.name,
        })),
    ];

    const categoryOptions: Option[] = [
        { value: '', label: 'All Categories' },
        ...safeCategories.map((category) => ({
            value: category._id || category.name,
            label: category.name,
        })),
    ];

    const priceOptions: Option[] = [
        { value: '', label: 'All Prices' },
        { value: '0-100', label: '$0 - $100' },
        { value: '100-150', label: '$100 - $150' },
        { value: '150-', label: '$150+' },
    ];

    const sortOptions: Option[] = [
        { value: '', label: 'Sort' },
        { value: 'asc', label: 'Price: Low to High' },
        { value: 'desc', label: 'Price: High to Low' },
    ];

    const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));
    const close = () => setOpenId(null);

    const handleReset = () => {
        close();
        onReset();
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <aside className="w-full space-y-4 md:sticky md:top-18">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-wider text-gray-800 sm:text-3xl">
                        Filters
                    </h2>
                    {activeFilterCount > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            {activeFilterCount}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    disabled={activeFilterCount === 0}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Reset all filters"
                >
                    <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"
                        />
                    </svg>
                    Reset
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <Dropdown
                    id="brand"
                    value={filters.brand}
                    options={brandOptions}
                    isOpen={openId === 'brand'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={(value) => onFilterChange('brand', value)}
                />
                <Dropdown
                    id="category"
                    value={filters.category}
                    options={categoryOptions}
                    isOpen={openId === 'category'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={(value) => onFilterChange('category', value)}
                />
                <Dropdown
                    id="price"
                    value={filters.price}
                    options={priceOptions}
                    isOpen={openId === 'price'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={(value) => onFilterChange('price', value)}
                />
                <Dropdown
                    id="sort"
                    value={filters.sort}
                    options={sortOptions}
                    isOpen={openId === 'sort'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={(value) => onFilterChange('sort', value)}
                />
            </div>
        </aside>
    );
}