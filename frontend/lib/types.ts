// Types for the Environmental ServiceSense Platform

export type EnvCategory = 'air' | 'water' | 'land' | 'waste' | 'general';
export type VerificationStatus = 'valid' | 'needs_review' | 'invalid';

export interface User {
    id: string;
    userName: string;
    email: string;
    displayName?: string;
    bio?: string;
    photoURL?: string | null;
    followersCount?: number;
    followingCount?: number;
    createdAt: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface NewsArticle {
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
    publishedAt: string;
    category: EnvCategory;
    confidence: number;
    locality?: string;
    summary?: string;
    urlToImage?: string | null;
    actions: string[];
}

export interface Comment {
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
}

export interface ImpactUpdate {
    text: string;
    mediaUrls?: string[];
    createdAt: string;
}

export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    title: string;
    description: string;
    category: EnvCategory;
    locality: string;
    mediaUrls?: string[];
    likes: number;
    likedBy?: string[];
    comments: Comment[];
    aiVerification: VerificationStatus;
    verificationReason?: string;
    credibilityScore: number;
    createdAt: string;
    updates: ImpactUpdate[];
    isAnonymous?: boolean;
}

export interface TrendPoint {
    month: string;
    air: number;
    water: number;
    land: number;
    waste: number;
    general: number;
}

export interface HeatmapPoint {
    locality: string;
    lat: number;
    lng: number;
    count: number;
    category: string;
}

export interface DashboardSummary {
    totalNews: number;
    totalCommunityPosts: number;
    validatedPosts: number;
    localitiesCovered: number;
    categoriesActive: number;
}

export interface CategoryTheme {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    icon: string;
    gradient: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    air: {
        name: 'Air Pollution',
        primary: '#60a5fa',
        secondary: '#93c5fd',
        accent: '#3b82f6',
        bg: 'from-blue-950 via-blue-900 to-slate-900',
        text: 'text-blue-300',
        icon: '💨',
        gradient: 'from-blue-500/20 to-blue-600/10',
    },
    water: {
        name: 'Water Pollution',
        primary: '#22d3ee',
        secondary: '#67e8f9',
        accent: '#06b6d4',
        bg: 'from-cyan-950 via-cyan-900 to-slate-900',
        text: 'text-cyan-300',
        icon: '🌊',
        gradient: 'from-cyan-500/20 to-cyan-600/10',
    },
    land: {
        name: 'Land & Forest',
        primary: '#4ade80',
        secondary: '#86efac',
        accent: '#22c55e',
        bg: 'from-green-950 via-green-900 to-slate-900',
        text: 'text-green-300',
        icon: '🌿',
        gradient: 'from-green-500/20 to-green-600/10',
    },
    waste: {
        name: 'Waste Management',
        primary: '#fb923c',
        secondary: '#fdba74',
        accent: '#f97316',
        bg: 'from-orange-950 via-orange-900 to-slate-900',
        text: 'text-orange-300',
        icon: '♻️',
        gradient: 'from-orange-500/20 to-orange-600/10',
    },
    general: {
        name: 'General Environment',
        primary: '#a78bfa',
        secondary: '#c4b5fd',
        accent: '#8b5cf6',
        bg: 'from-purple-950 via-purple-900 to-slate-900',
        text: 'text-purple-300',
        icon: '🌍',
        gradient: 'from-purple-500/20 to-purple-600/10',
    },
};

export const LOCALITIES = [
    'All India', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai',
    'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad', 'Jaipur',
    'Lucknow', 'Surat', 'Nagpur',
];
