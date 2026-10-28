import Footer from '@/components/Footer';
import { getProducts } from '@/actions/productActions';
import { getBrands, getCategories } from '@/actions/categoryBrandActions';
import type { Product, Brand, Category } from '@/types';
import ProductsBrowser from '@/components/ProductsBrowser';

const LIMIT = 11;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-gray-800">
      <main className="w-full max-w-[1640px] mx-auto px-4 md:px-10">
        <BrowserLoader />
      </main>
      <Footer />
    </div>
  );
}

async function BrowserLoader() {
  const [res, brands, categories] = await Promise.all([
    getProducts(1, LIMIT),
    getBrands(),
    getCategories(),
  ]);

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