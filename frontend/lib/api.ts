// API client for Environmental ServiceSense backend
import { getFallbackData } from './mockData';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        // Add auth token if available (client-side only)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}${path}`, {
            headers: { ...headers, ...options?.headers },
            ...options,
        });
        if (!res.ok) {
            if (path.startsWith('/api/auth')) {
                const errData = await res.json().catch(() => ({}));
                // 401 on /api/auth/me is expected when not logged in — no need to warn
                if (!(path === '/api/auth/me' && res.status === 401)) {
                    console.warn(`[Auth] API error ${res.status} for ${path}: ${errData.detail || ''}`);
                }
                throw new Error(errData.detail || `Authentication failed: ${res.status}`);
            }
            console.warn(`[Offline Fallback] API error ${res.status} for ${path}, using static demo data.`);
            return getFallbackData(path) as T;
        }
        return res.json() as Promise<T>;
    } catch (error) {
        console.warn(`[Offline Fallback] Connection failed for ${path}, using static demo data.`, error);
        return getFallbackData(path) as T;
    }
}

// ── News ─────────────────────────────────────────────────────────────────────
export const newsApi = {
    getAll: (params: { category?: string; locality?: string; page?: number; search?: string; timeFilter?: string } = {}) => {
        const q = new URLSearchParams();
        if (params.category) q.set('category', params.category);
        if (params.locality) q.set('locality', params.locality);
        if (params.page) q.set('page', String(params.page));
        if (params.search) q.set('search', params.search);
        if (params.timeFilter) q.set('time_filter', params.timeFilter);
        return request<{ articles: any[]; total: number }>(`/api/news?${q}`);
    },

    fetchAndClassify: (category = '', locality = '') =>
        request<{ message: string; total_raw: number }>(
            `/api/news/fetch?category=${category}&locality=${locality}`,
            { method: 'POST' },
        ),

    getStats: () => request<{ distribution: Record<string, number>; total: number }>('/api/news/stats'),

    classify: (text: string) =>
        request<{ category: string; confidence: number }>('/api/news/classify', {
            method: 'POST',
            body: JSON.stringify({ text }),
        }),
};

// ── Community ─────────────────────────────────────────────────────────────────
export const communityApi = {
    getAll: (params: { category?: string; locality?: string; page?: number } = {}) => {
        const q = new URLSearchParams();
        if (params.category) q.set('category', params.category);
        if (params.locality) q.set('locality', params.locality);
        if (params.page) q.set('page', String(params.page));
        return request<{ posts: any[]; total: number }>(`/api/community/posts?${q}`);
    },

    createPost: (data: any) =>
        request<any>('/api/community/posts', { method: 'POST', body: JSON.stringify(data) }),

    likePost: (postId: string, userId: string) =>
        request<any>(`/api/community/posts/${postId}/like`, {
            method: 'PUT',
            body: JSON.stringify({ userId }),
        }),

    addComment: (postId: string, data: { userId: string; userName: string; text: string }) =>
        request<any>(`/api/community/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    addImpactUpdate: (postId: string, data: { text: string; imageUrl?: string }) =>
        request<any>(`/api/community/posts/${postId}/update`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
    getTrends: (months = 6) =>
        request<{ trends: any[] }>(`/api/analytics/trends?months=${months}`),

    getHeatmap: () => request<{ points: any[] }>('/api/analytics/heatmap'),

    getSummary: () => request<any>('/api/analytics/summary'),
};

// ── Authentication ─────────────────────────────────────────────────────────────
import { User, TokenResponse } from './types';

export const authApi = {
    login: (data: any) => request<TokenResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => request<TokenResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request<User>('/api/auth/me'),
    updateProfile: (data: Partial<User>) => request<User>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: () => request<{ status: string }>('/api/auth/me', { method: 'DELETE' }),
    checkUsername: (username: string) => request<{ available: boolean }>(`/api/auth/check-username?username=${username}`),
    getUserProfile: (username: string) => request<User>(`/api/auth/users/${username}`),
    followUser: (username: string) => request<any>(`/api/auth/users/${username}/follow`, { method: 'POST' }),
    unfollowUser: (username: string) => request<any>(`/api/auth/users/${username}/unfollow`, { method: 'POST' }),

    setToken: (token: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }
};
