import ProductSkeleton from '@/components/ProductSkeleton';
import Footer from '@/components/Footer';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col justify-between bg-white text-gray-800">
            <main className="w-full max-w-[1640px] mx-auto px-10 py-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2">
                    <div className="w-32 h-8 bg-gray-200 animate-pulse rounded-md" />
                    <div className="w-36 h-8 bg-gray-200 animate-pulse rounded-full" />
                </div>
                <div className="w-full h-11 bg-gray-100 animate-pulse rounded-lg" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-2">
                    <div className="md:col-span-3">
                        <ProductSkeleton />
                    </div>

                    <div className="md:col-span-1 flex flex-col gap-4">
                        <div className="w-24 h-6 bg-gray-200 animate-pulse rounded mb-2" />
                        <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
                        <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
                        <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
                        <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg" />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}