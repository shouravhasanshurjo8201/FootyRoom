'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { FaXTwitter, FaYoutube, FaFacebookF } from "react-icons/fa6";

export default function Footer() {
    const [currentYear, setCurrentYear] = useState<number>(2026);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="mt-12 w-full border-t border-gray-200 bg-white py-6">
            <div className="mx-auto flex w-full max-w-[1640px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-10 text-xs font-mono text-gray-500">

                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-1 sm:gap-3 text-center sm:text-left">
                    <span className="text-lg font-extrabold tracking-wide text-emerald-400 logo-font">
                        FootyRoom
                    </span>
                    <span className="text-gray-500">
                        Copyright &copy; {currentYear} - All rights reserved
                    </span>
                </div>

                <div className="flex items-center gap-5 text-gray-700">
                    <Link
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X (Twitter)"
                        className="transition hover:text-emerald-500"
                    >
                        <FaXTwitter className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>

                    <Link
                        href="https://youtube.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="transition hover:text-emerald-500"
                    >
                        <FaYoutube className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>

                    <Link
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="transition hover:text-emerald-500"
                    >
                        <FaFacebookF className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
                </div>

            </div>
        </footer>
    );
}