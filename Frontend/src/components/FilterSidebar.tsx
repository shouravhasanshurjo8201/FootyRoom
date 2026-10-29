import { useState } from 'react';
import type { DropdownProps, FilterSidebarProps, Option } from '@/types';

function Dropdown({ id, value, options, isOpen, onToggle, onClose, onSelect }: DropdownProps) {
    const selected = options.find((o) => o.value === value) ?? options[0];

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
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                }}
                className={`relative z-20 w-full flex items-center justify-between border rounded-lg bg-white px-3 py-2.5 text-xs sm:text-sm font-mono text-gray-700 shadow-sm focus:outline-none ${isOpen
                    ? 'border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
            >
                <span className="truncate">{selected?.label}</span>
                <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <ul
                    role="listbox"
                    className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {options.map((o) => {
                        const active = o.value === value;
                        return (
                            <li key={o.value} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelect(o.value);
                                        onClose();
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-mono transition ${active
                                        ? 'bg-emerald-50 text-emerald-600 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {o.label}
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
    selectedBrand,
    setSelectedBrand,
    selectedCategory,
    setSelectedCategory,
    selectedPrice,
    setSelectedPrice,
    sort,
    setSort,
}: FilterSidebarProps) {

    const [openId, setOpenId] = useState<string | null>(null);

    const safeBrands = Array.isArray(brands) ? brands : [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    const brandOptions: Option[] = [
        { value: '', label: 'All Brands' },
        ...safeBrands.map((b) => ({ value: b._id || b.name, label: b.name })),
    ];

    const categoryOptions: Option[] = [
        { value: '', label: 'All Category' },
        ...safeCategories.map((c) => ({ value: c._id || c.name, label: c.name })),
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

    const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
    const close = () => setOpenId(null);

    return (
        <aside className="w-full space-y-4 md:sticky md:top-18">
            <h2 className="text-2xl sm:text-3xl text-center font-black font-mono tracking-wider text-gray-800 mb-2 sm:mb-4">
                Filters
            </h2>

            <div className="flex flex-col gap-3">
                <Dropdown
                    id="brand"
                    value={selectedBrand}
                    options={brandOptions}
                    isOpen={openId === 'brand'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={setSelectedBrand}
                />
                <Dropdown
                    id="category"
                    value={selectedCategory}
                    options={categoryOptions}
                    isOpen={openId === 'category'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={setSelectedCategory}
                />
                <Dropdown
                    id="price"
                    value={selectedPrice}
                    options={priceOptions}
                    isOpen={openId === 'price'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={setSelectedPrice}
                />
                <Dropdown
                    id="sort"
                    value={sort}
                    options={sortOptions}
                    isOpen={openId === 'sort'}
                    onToggle={toggle}
                    onClose={close}
                    onSelect={setSort}
                />
            </div>
        </aside>
    );
}