'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import { newsApi, analyticsApi } from '@/lib/api';
import { NewsArticle, TrendPoint } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const FOREST_STATS = [
    { label: 'Forest Cover', value: '21.7', unit: '%', desc: 'of total land area', icon: '🌳', color: '#4ade80' },
    { label: 'Tree Cover Loss', value: '1.2M', unit: 'ha/yr', desc: 'estimated annually', icon: '🪵', color: '#fb923c' },
    { label: 'Protected Area', value: '5.02', unit: '%', desc: 'under protection', icon: '🛡️', color: '#22d3ee' },
    { label: 'Afforestation', value: '+0.8M', unit: 'ha', desc: 'planted last year', icon: '🌱', color: '#a78bfa' },
];

export default function LandDashboard() {
    const [locality, setLocality] = useState('All India');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const loc = locality === 'All India' ? '' : locality;
        try {
            const [news, trendData] = await Promise.all([
                newsApi.getAll({ category: 'land', locality: loc }),
                analyticsApi.getTrends(6),
            ]);
            setArticles(news.articles);
            setTrends(trendData.trends);
        } catch { /* backend offline */ }
        setLoading(false);
    }, [locality]);

    useEffect(() => { loadData(); }, [loadData]);

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar locality={locality} onLocalityChange={setLocality} />
            <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-8">

                {/* Hero */}
                <section className="relative rounded-3xl overflow-hidden border border-green-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-950/80 via-green-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.12),transparent_70%)]" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-4xl">🌿</span>
                            <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">Land & Forest Monitor</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Land / Forest Dashboard</h1>
                        <p className="text-green-300 text-sm">Forests, soil and land health news for {locality}</p>
                    </div>
                </section>

                {/* Forest Stats */}
                <section>
                    <h2 className="text-base font-semibold text-white mb-3">🌳 Forest & Land Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {FOREST_STATS.map((stat) => (
                            <div key={stat.label} className="glass-card p-5">
                                <div className="text-2xl mb-2">{stat.icon}</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</span>
                                    <span className="text-xs text-slate-500">{stat.unit}</span>
                                </div>
                                <p className="text-xs font-medium text-white mt-0.5">{stat.label}</p>
                                <p className="text-xs text-slate-500">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trend Chart */}
                {trends.length > 0 && (
                    <section className="chart-container">
                        <h2 className="text-base font-semibold text-white mb-4">📈 Land & Forest Issue Trend</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                <Area type="monotone" dataKey="land" stroke="#4ade80" strokeWidth={2} fill="url(#landGrad)" dot={{ fill: '#4ade80', r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </section>
                )}

                {/* News */}
                <section>
                    <h2 className="section-title">🌿 Land & Forest News</h2>
                    <p className="section-subtitle">Forest and land news and updates — {locality}</p>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-44 animate-pulse" />)}
                        </div>
                    ) : articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {articles.map((a) => <NewsCard key={a.id} article={a} />)}
                        </div>
                    ) : (
                        <div className="glass-card p-10 text-center text-slate-500">
                            <div className="text-3xl mb-2">🌿</div>
                            <p>No land/forest articles yet. Fetch news from the main dashboard.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
