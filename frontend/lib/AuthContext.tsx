'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as ApiUser } from '@/lib/types';
import { authApi } from '@/lib/api';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface AppUser extends ApiUser {
    uid: string;
}

interface AuthContextValue {
    user: AppUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    isDemo: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    logout: async () => { },
    refreshUser: async () => { },
    isDemo: IS_DEMO,
});

export function createGuestUser(name: string): AppUser {
    return {
        id: 'demo-' + Math.random().toString(36).slice(2, 8),
        uid: 'demo-' + Math.random().toString(36).slice(2, 8),
        userName: name.toLowerCase().replace(/\s+/g, '') || 'guest',
        email: 'guest@demo.com',
        displayName: name || 'Guest',
        photoURL: null,
        bio: '',
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        setLoading(true);
        try {
            if (typeof window !== 'undefined' && localStorage.getItem('token')) {
                const apiUser = await authApi.getMe();
                setUser({ ...apiUser, uid: apiUser.id });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
            authApi.logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (IS_DEMO) {
            const raw = sessionStorage.getItem('demo_user');
            if (raw) setUser(JSON.parse(raw));
            setLoading(false);
            return;
        }

        refreshUser();
    }, []);

    const logout = async () => {
        if (IS_DEMO) {
            sessionStorage.removeItem('demo_user');
            setUser(null);
            return;
        }

        authApi.logout();
        setUser(null);
    };

    const loginAsGuest = (name: string) => {
        const guest = createGuestUser(name);
        sessionStorage.setItem('demo_user', JSON.stringify(guest));
        setUser(guest);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshUser, isDemo: IS_DEMO }}>
            {IS_DEMO && (
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.__loginAsGuest = ${loginAsGuest.toString()}`,
                    }}
                />
            )}
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
