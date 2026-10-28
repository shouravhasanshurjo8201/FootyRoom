import { PaginationProps } from "@/types";

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded border border-emerald-500 text-emerald-500 flex items-center justify-center font-bold disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
            >
                &laquo;
            </button>

            {pages.map((p) => (
                <button
                    type="button"
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 rounded font-mono text-xs font-bold transition ${p === currentPage
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {p}
                </button>
            ))}

            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded border border-emerald-500 text-emerald-500 flex items-center justify-center font-bold disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
            >
                &raquo;
            </button>
        </div>
    );
}








// 'use client';

// import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// interface PaginationProps {
//     currentPage: number;
//     totalPages: number;
// }

// export default function Pagination({ currentPage, totalPages }: PaginationProps) {
//     const router = useRouter();
//     const pathname = usePathname();
//     const searchParams = useSearchParams();

//     const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

//     const onPageChange = (page: number) => {
//         if (page < 1 || page > totalPages) return;
//         const params = new URLSearchParams(searchParams.toString());
//         if (page === 1) params.delete('page');
//         else params.set('page', String(page));
//         const qs = params.toString();
//         router.push(qs ? `${pathname}?${qs}` : pathname);
//     };

//     return (
//         <div className="flex items-center justify-center gap-2 mt-8">
//             <button
//                 type="button"
//                 onClick={() => onPageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 className="w-8 h-8 rounded border border-emerald-500 text-emerald-500 flex items-center justify-center font-bold disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
//             >
//                 &laquo;
//             </button>

//             {pages.map((p) => (
//                 <button
//                     type="button"
//                     key={p}
//                     onClick={() => onPageChange(p)}
//                     className={`w-8 h-8 rounded font-mono text-xs font-bold transition ${p === currentPage
//                             ? 'bg-emerald-500 text-white'
//                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                         }`}
//                 >
//                     {p}
//                 </button>
//             ))}

//             <button
//                 type="button"
//                 onClick={() => onPageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//                 className="w-8 h-8 rounded border border-emerald-500 text-emerald-500 flex items-center justify-center font-bold disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-300"
//             >
//                 &raquo;
//             </button>
//         </div>
//     );
// }