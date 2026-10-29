import Footer from '@/components/Footer';
import { getProducts } from '@/actions/productActions';
import { getBrands, getCategories } from '@/actions/categoryBrandActions';
import type { Product, Brand, Category } from '@/types';
import ProductsBrowser from '@/components/ProductsBrowser';
import { Suspense } from 'react';

const LIMIT = 9;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-gray-800">
      <main className="w-full max-w-[1640px] mx-auto px-4 md:px-10">
        <Suspense fallback={<div className="py-20 text-center font-mono text-gray-400">Loading products...</div>}>
          <BrowserLoader />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

async function BrowserLoader() {
  let res: any = { products: [], totalPages: 1 };
  let brands: Brand[] = [];
  let categories: Category[] = [];

  try {
    const [productsRes, brandsRes, categoriesRes] = await Promise.all([
      getProducts(1, LIMIT),
      getBrands(),
      getCategories(),
    ]);
    if (productsRes) res = productsRes;
    if (brandsRes) brands = brandsRes;
    if (categoriesRes) categories = categoriesRes;
  } catch (error) {
    console.error('Failed to load initial home data:', error);
  }

  const initialProducts: Product[] = Array.isArray(res?.products) ? res.products : [];
  const initialTotalPages: number = res?.totalPages || 1;
  const safeBrands: Brand[] = Array.isArray(brands) ? brands : [];
  const safeCategories: Category[] = Array.isArray(categories) ? categories : [];

  return (
    <ProductsBrowser
      initialProducts={initialProducts}
      initialTotalPages={initialTotalPages}
      brands={safeBrands}
      categories={safeCategories}
      limit={LIMIT}
    />
  );
}