export default function ProductSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="border border-gray-200 rounded p-3 h-80 flex flex-col justify-between">
                    <div className="w-full h-48 bg-gray-200 rounded mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="flex justify-between mt-auto pt-2">
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}