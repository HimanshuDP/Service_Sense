'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALITIES } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import LoginModal from '@/components/LoginModal';

const NAV_LINKS = [
    { label: 'Dashboard', href: '/', icon: '🌍' },
    { label: 'Air', href: '/dashboard/air', icon: '💨' },
    { label: 'Water', href: '/dashboard/water', icon: '🌊' },
    { label: 'Land', href: '/dashboard/land', icon: '🌿' },
    { label: 'Waste', href: '/dashboard/waste', icon: '♻️' },
    { label: 'Community', href: '/dashboard/community', icon: '🤝' },
    { label: 'Heatmap', href: '/dashboard/heatmap', icon: '🗺️' },
    { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
];

interface NavbarProps {
    locality: string;
    onLocalityChange: (l: string) => void;
}

export default function Navbar({ locality, onLocalityChange }: NavbarProps) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const { user, logout } = useAuth();

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
                <div className="mx-auto max-w-screen-xl px-4">
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 shrink-0">
                            <span className="text-2xl">🌱</span>
                            <span className="font-bold text-lg tracking-tight">
                                <span className="text-green-400">Service</span>
                                <span className="text-white">Sense</span>
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {NAV_LINKS.map((link) => {
                                const active = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'text-slate-400 hover:text-white hover:bg-white/8'
                                            }`}
                                    >
                                        <span>{link.icon}</span>
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Right side: Locality picker + Auth + Mobile toggle */}
                        <div className="flex items-center gap-2">
                            <select
                                value={locality}
                                onChange={(e) => onLocalityChange(e.target.value)}
                                className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-green-500/50 cursor-pointer"
                            >
                                {LOCALITIES.map((l) => (
                                    <option key={l} value={l} className="bg-slate-900">
                                        {l === 'All India' ? '📍 All India' : `📍 ${l}`}
                                    </option>
                                ))}
                            </select>

                            {/* Auth section */}
                            {user ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/profile" className="flex items-center gap-2 hover:bg-white/5 py-1 px-2 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full border border-white/20" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-green-500/30 flex items-center justify-center text-xs text-green-400 font-bold">
                                                {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="hidden lg:block text-xs text-slate-400 max-w-[100px] truncate">
                                            {user.displayName || user.email}
                                        </span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="text-xs text-slate-500 hover:text-red-400 border border-white/10 px-2 py-1 rounded-lg transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="btn-primary !py-1.5 !px-3 text-xs"
                                >
                                    🔑 Sign In
                                </button>
                            )}

                            <button
                                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                onClick={() => setMenuOpen((o) => !o)}
                            >
                                {menuOpen ? '✕' : '☰'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {menuOpen && (
                        <div className="md:hidden pb-4 pt-1 border-t border-white/10 mt-1">
                            <select
                                value={locality}
                                onChange={(e) => onLocalityChange(e.target.value)}
                                className="w-full mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none"
                            >
                                {LOCALITIES.map((l) => (
                                    <option key={l} value={l} className="bg-slate-900">{l}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-1">
                                {NAV_LINKS.map((link) => {
                                    const active = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                      ${active ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}
                                        >
                                            <span>{link.icon}</span>
                                            <span>{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                            {!user && (
                                <button
                                    onClick={() => { setMenuOpen(false); setShowLogin(true); }}
                                    className="w-full mt-3 btn-primary justify-center"
                                >
                                    🔑 Sign In / Register
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Login Modal */}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </>
    );
}
