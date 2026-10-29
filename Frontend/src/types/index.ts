export interface Product {
    _id: string;
    productName: string;
    price: number;
    brand: {
        _id: string;
        name: string;
        slug: string;
    };
    category?: {
        _id: string;
        name: string;
        slug: string;
    };
    avatar?: string;
    createdAt?: string;
}

export interface Brand {
    _id: string;
    name: string;
}

export interface Category {
    _id: string;
    name: string;
}

export interface User {
    _id?: string;
    name: string;
    email: string;
    image?: string;
    avatar?: string;
}

export interface ProductsResponse {
    products: Product[];
    total: number;
    totalPages: number;
    currentPage: number;
}

export interface ApiEnvelope<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
    expiresIn?: number;
}

export interface Filters {
    brand: string;
    category: string;
    price: string;
    sort: string;
}

export interface FetchParams extends Filters {
    query: string;
    page: number;
}

export interface ProductsBrowserProps {
    initialProducts: Product[];
    initialTotalPages: number;
    brands: Brand[];
    categories: Category[];
    limit: number;
}
export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}


export interface NavbarProps {
    searchQuery: string;
    onSearch: (query: string) => void;
    onSearchNow?: (query: string) => void;
}

export interface FilterSidebarProps {
    brands: Brand[];
    categories: Category[];
    filters: Filters;
    onFilterChange: (key: keyof Filters, value: string) => void;
    onReset: () => void;
}

export interface Option {
    value: string;
    label: string;
}

export interface DropdownProps {
    id: string;
    value: string;
    options: Option[];
    isOpen: boolean;
    onToggle: (id: string) => void;
    onClose: () => void;
    onSelect: (value: string) => void;
}