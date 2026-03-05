'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CommunityPostCard from '@/components/CommunityPostCard';
import PostForm from '@/components/PostForm';
import InstagramPostModal from '@/components/InstagramPostModal';
import { communityApi } from '@/lib/api';
import { CommunityPost, EnvCategory } from '@/lib/types';

const FILTER_CATS: { value: string; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '🌍' },
    { value: 'air', label: 'Air', icon: '💨' },
    { value: 'water', label: 'Water', icon: '🌊' },
    { value: 'land', label: 'Land', icon: '🌿' },
    { value: 'waste', label: 'Waste', icon: '♻️' },
    { value: 'general', label: 'General', icon: '🔵' },
];

export default function CommunityDashboard() {
    const [locality, setLocality] = useState('All India');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [catFilter, setCatFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

    const localityParam = locality === 'All India' ? '' : locality;

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await communityApi.getAll({
                category: catFilter === 'all' ? '' : catFilter,
                locality: localityParam,
                page,
            });
            setPosts(res.posts);
            setTotal(res.total);
        } catch { /* backend offline */ }
        setLoading(false);
    }, [catFilter, localityParam, page]);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar locality={locality} onLocalityChange={(l) => { setLocality(l); setPage(1); }} />
            <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-8">

                {/* Hero */}
                <section className="relative rounded-3xl overflow-hidden border border-emerald-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-teal-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)]" />
                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-4xl">🤝</span>
                                <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Community Hub</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Community Action Dashboard</h1>
                            <p className="text-emerald-300 text-sm">
                                Report environmental issues · AI-verified posts · Community-driven solutions
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
                                {showForm ? '✕ Close' : '📝 Report Issue'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Stats bar */}
                <section className="grid grid-cols-3 gap-4">
                    <div className="stat-card text-center">
                        <div className="text-2xl font-black text-emerald-400">{total}</div>
                        <div className="text-xs text-slate-500">Total Reports</div>
                    </div>
                    <div className="stat-card text-center">
                        <div className="text-2xl font-black text-green-400">
                            {posts.filter(p => p.aiVerification === 'valid').length}
                        </div>
                        <div className="text-xs text-slate-500">✅ Verified</div>
                    </div>
                    <div className="stat-card text-center">
                        <div className="text-2xl font-black text-yellow-400">
                            {posts.filter(p => p.aiVerification === 'needs_review').length}
                        </div>
                        <div className="text-xs text-slate-500">⏳ Under Review</div>
                    </div>
                </section>

                {/* Post Form */}
                {showForm && (
                    <PostForm onSuccess={() => { setShowForm(false); loadPosts(); }} />
                )}

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                    {FILTER_CATS.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => { setCatFilter(cat.value); setPage(1); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                ${catFilter === cat.value
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Posts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-48 animate-pulse" />)}
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posts.map((p) => (
                                <div key={p.id} onClick={() => setSelectedPost(p)} className="cursor-pointer">
                                    <CommunityPostCard post={p} onUpdate={loadPosts} />
                                </div>
                            ))}
                        </div>
                        {total > 12 && (
                            <div className="flex justify-center gap-3 mt-4">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost border border-white/10">← Prev</button>
                                <span className="text-sm text-slate-500 flex items-center">Page {page} of {Math.ceil(total / 12)}</span>
                                <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)} className="btn-ghost border border-white/10">Next →</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <div className="text-5xl mb-4">🤝</div>
                        <h3 className="text-lg font-semibold text-white mb-2">No community reports yet</h3>
                        <p className="text-slate-500 text-sm mb-4">Be the first to report an environmental issue in your area!</p>
                        <button onClick={() => setShowForm(true)} className="btn-primary">📝 Report an Issue</button>
                    </div>
                )}
            </main>

            {selectedPost && (
                <InstagramPostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onUpdate={() => {
                        loadPosts();
                        // Refresh the selected post data after an update
                        communityApi.getAll({ category: catFilter === 'all' ? '' : catFilter, locality: localityParam, page }).then(res => {
                            const updated = res.posts.find((p: CommunityPost) => p.id === selectedPost.id);
                            if (updated) setSelectedPost(updated);
                        });
                    }}
                />
            )}
        </div>
    );
}
