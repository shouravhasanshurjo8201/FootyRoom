'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useAuth } from './providers/AuthProvider';
import { NavbarProps } from '@/types';

export default function Navbar({ searchQuery, onSearch, onSearchNow }: NavbarProps) {
    const { user, loading, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutError, setLogoutError] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutConfirm = async () => {
        setIsLoggingOut(true);
        setLogoutError('');
        try {
            await logout();
            setShowLogoutModal(false);
        } catch (error) {
            console.error('Logout error:', error);
            setLogoutError('Could not log out. Please try again.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="w-full py-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 tracking-wide logo-font">
                    FootyRoom
                </h1>

                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    ) : user ? (
                        <div className="flex items-center gap-3 px-3 py-1.5">
                            <span className="text-xs sm:text-sm font-mono font-semibold text-gray-700 max-w-[120px] sm:max-w-[180px] truncate">
                                {user.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setLogoutError('');
                                    setShowLogoutModal(true);
                                }}
                                title="Click to Logout"
                                className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <Image
                                    src={user?.avatar || '/avatar-placeholder.png'}
                                    alt={user.name || 'User Avatar'}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full border border-emerald-500 object-cover"
                                />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => signIn('google')}
                            className="bg-emerald-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition shadow-sm"
                        >
                            Sign in with Google
                        </button>
                    )}
                </div>
            </div>

            <div className="sticky top-4 z-[1000] w-full bg-white/95 backdrop-blur-md py-2">
                <div className="relative w-full">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onSearchNow?.(e.currentTarget.value);
                        }}
                        placeholder="Search products..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {showLogoutModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Logout Confirmation</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to log out of your account?
                        </p>
                        {logoutError && (
                            <p role="alert" className="text-sm text-red-600 mb-4">
                                {logoutError}
                            </p>
                        )}
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogoutConfirm}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition shadow-sm"
                            >
                                {isLoggingOut ? 'Logging out…' : 'Yes, Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}