'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import { newsApi, analyticsApi } from '@/lib/api';
import { NewsArticle, TrendPoint } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const WASTE_TIPS = [
    { tip: 'Segregate waste into wet, dry & hazardous at home', icon: '🗑️' },
    { tip: 'Use reusable bags & containers instead of single-use plastic', icon: '♻️' },
    { tip: 'Compost organic waste to reduce landfill burden', icon: '🌱' },
    { tip: 'Choose products with minimal or recyclable packaging', icon: '📦' },
    { tip: 'Report illegal dumping to local municipal authorities', icon: '📢' },
];

const WASTE_TYPES = [
    { name: 'Organic', percent: 56, color: '#4ade80' },
    { name: 'Plastic', percent: 14, color: '#60a5fa' },
    { name: 'Paper', percent: 9, color: '#facc15' },
    { name: 'Metal', percent: 5, color: '#94a3b8' },
    { name: 'E-Waste', percent: 3, color: '#f87171' },
    { name: 'Others', percent: 13, color: '#a78bfa' },
];

export default function WasteDashboard() {
    const [locality, setLocality] = useState('All India');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const loc = locality === 'All India' ? '' : locality;
        try {
            const [news, trendData] = await Promise.all([
                newsApi.getAll({ category: 'waste', locality: loc }),
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
                <section className="relative rounded-3xl overflow-hidden border border-orange-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-orange-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.15),transparent_70%)]" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-4xl">♻️</span>
                            <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20">Waste Monitor</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Waste Management Dashboard</h1>
                        <p className="text-orange-300 text-sm">Recycling tips and waste news for {locality}</p>
                    </div>
                </section>

                {/* Waste composition + tips */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="chart-container">
                        <h2 className="text-base font-semibold text-white mb-4">🗑️ Waste Breakdown</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={WASTE_TYPES} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} formatter={(v: any) => [`${v}%`]} />
                                <Bar dataKey="percent" radius={[0, 6, 6, 0]}>
                                    {WASTE_TYPES.map((w, i) => <Cell key={i} fill={w.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-card p-5">
                        <h2 className="text-base font-semibold text-white mb-4">💡 Waste Reduction Tips</h2>
                        <ul className="space-y-3">
                            {WASTE_TIPS.map((t, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="text-lg shrink-0">{t.icon}</span>
                                    <span>{t.tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Trend Chart */}
                {trends.length > 0 && (
                    <section className="chart-container">
                        <h2 className="text-base font-semibold text-white mb-4">📈 Waste Pollution Trend</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                <Bar dataKey="waste" fill="#fb923c" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                )}

                {/* News */}
                <section>
                    <h2 className="section-title">♻️ Waste Management News</h2>
                    <p className="section-subtitle">Waste and recycling news — {locality}</p>
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
                            <div className="text-3xl mb-2">♻️</div>
                            <p>No waste articles yet. Fetch news from the main dashboard.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
