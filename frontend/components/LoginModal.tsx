'use client';

import { useState, useEffect } from 'react';
import { useAuth, createGuestUser } from '@/lib/AuthContext';
import { authApi } from '@/lib/api';

interface LoginModalProps {
    onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
    const { isDemo, refreshUser } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null);
    const [checkingUserName, setCheckingUserName] = useState(false);

    // Debounced username check
    useEffect(() => {
        if (isLogin || !userName) {
            setUserNameAvailable(null);
            return;
        }
        setCheckingUserName(true);
        const timer = setTimeout(async () => {
            try {
                const res = await authApi.checkUsername(userName);
                setUserNameAvailable(res.available);
            } catch (err) {
                setUserNameAvailable(null);
            } finally {
                setCheckingUserName(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [userName, isLogin]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isDemo) {
                if (typeof window !== 'undefined' && (window as any).__loginAsGuest) {
                    (window as any).__loginAsGuest(userName || email.split('@')[0] || 'Demo User');
                }
                onClose();
                return;
            }

            if (isLogin) {
                const res = await authApi.login({ email, password });
                authApi.setToken(res.access_token);
            } else {
                if (userNameAvailable === false) {
                    setError('Please choose an available username first.');
                    setLoading(false);
                    return;
                }
                const res = await authApi.register({ userName, email, password });
                authApi.setToken(res.access_token);
            }

            await refreshUser();
            onClose();
        } catch (err: any) {
            setError(err.detail || err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            if (isDemo) {
                if (typeof window !== 'undefined' && (window as any).__loginAsGuest) {
                    (window as any).__loginAsGuest('Google User');
                }
                onClose();
                return;
            }

            setError('Google Auth is unavailable on this custom backend.');
        } catch (err: any) {
            setError(err.message || 'Google Auth failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                {/* Tab switcher */}
                <div className="flex rounded-lg bg-slate-900/60 border border-white/10 p-1 mb-5">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-green-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-green-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                    {isDemo ? 'Running in Demo Mode (No real accounts created)' : isLogin ? 'Welcome back! Sign in to continue.' : 'Create your account to join the community.'}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                    {!isLogin && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-slate-400">Username</label>
                                {userName && !isLogin && (
                                    <span className={`text-[10px] font-medium ${checkingUserName ? 'text-slate-500' : userNameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                        {checkingUserName ? 'Checking...' : userNameAvailable ? '✓ Available' : '✕ Taken'}
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${userName && !checkingUserName && userNameAvailable === false ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-green-500'}`}
                                placeholder="E.g. eco_warrior"
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                    </button>
                </form>

                <div className="flex items-center gap-2 my-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-xs text-slate-500 font-medium">OR</span>
                    <div className="h-px bg-white/10 flex-1" />
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google (Demo only)
                </button>

            </div>
        </div>
    );
}
