import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
    return (
        <div className="border border-emerald-400 rounded p-3 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition">
            <div className="w-full h-68 rounded flex items-center justify-center overflow-hidden mb-3">
                <img
                    src={product.avatar || 'https://via.placeholder.com/200'}
                    alt={product.productName}
                    className=" h-full w-full"
                />
            </div>

            <div>
                <h3 className="font-mono text-md font-semibold text-gray-800 line-clamp-1">
                    {product.productName}
                </h3>
                <p className="font-mono text-sm text-gray-800 mt-1">
                    Price : <span className="font-bold">$ {product.price}</span>
                </p>
            </div>

            <div className="flex justify-between items-center text-sm font-mono text-gray-600 mt-2">
                <span>Brand: {product.brand?.name || 'rebook'}</span>
                <span>Date: {product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : '2024-08-17'}</span>
            </div>
        </div>
    );
}