// API client for Environmental ServiceSense backend
import { getFallbackData } from './mockData';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
console.log("[ServiceSense API] Client initialized - v2.1 (Multipart Fix)");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
        const headers: Record<string, string> = {};

        // Only default to JSON if we are not sending FormData
        // (FormData needs the browser to auto-generate the Content-Type with boundary)
        if (!(options?.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Add auth token if available (client-side only)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...headers, ...options?.headers },
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.warn(`[API Error] ${res.status} for ${path}:`, errBody);

            if (path.startsWith('/api/auth')) {
                throw new Error(errBody.detail || `Authentication failed: ${res.status}`);
            }

            // DO NOT use fallback for image classification - we want the real error or success
            if (path.includes('/classify-image')) {
                throw new Error(errBody.detail || `Classification failed (${res.status})`);
            }

            // For community mutations (POST/PUT/DELETE), surface errors to the user
            const method = options?.method?.toUpperCase() || 'GET';
            if (path.startsWith('/api/community') && method !== 'GET') {
                throw new Error(errBody.detail || `Request failed (${res.status})`);
            }

            console.warn(`[Offline Fallback] using static demo data.`);
            return getFallbackData(path) as T;
        }
        return res.json() as Promise<T>;
    } catch (error) {
        console.warn(`[Connection Error] for ${path}:`, error);
        if (path.includes('/classify-image')) throw error;
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

    classifyImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        console.log("SENDING FILE CLASSIFICATION REQUEST:");
        console.log("File name:", file.name, "File type:", file.type, "File size:", file.size);
        for (let pair of formData.entries()) {
            console.log("FormData:", pair[0], pair[1]);
        }

        return request<{ category: string; confidence: number; accepted: boolean; all_scores: any; message: string; mode: string }>('/api/community/classify-image', {
            method: 'POST',
            body: formData,
            // Let the browser set the multi-part boundary Content-Type
        });
    },


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

    deletePost: (postId: string) =>
        request<{ status: string; message: string }>(`/api/community/posts/${postId}`, {
            method: 'DELETE',
        }),

    classifyText: (title: string, description: string, category: string) =>
        request<{ status: string; reason: string; accepted: boolean }>('/api/community/classify-text', {
            method: 'POST',
            body: JSON.stringify({ title, description, category }),
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
