'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import { newsApi, analyticsApi } from '@/lib/api';
import { NewsArticle, TrendPoint } from '@/lib/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const WATER_INDICATORS = [
    { label: 'pH Level', value: '7.2', unit: '', status: 'good', icon: '🧪' },
    { label: 'Turbidity', value: '4.8', unit: 'NTU', status: 'moderate', icon: '💧' },
    { label: 'Dissolved O₂', value: '6.1', unit: 'mg/L', status: 'good', icon: '⚗️' },
    { label: 'Nitrates', value: '18', unit: 'mg/L', status: 'warning', icon: '⚠️' },
];

const STATUS_COLORS: Record<string, string> = {
    good: '#4ade80', moderate: '#facc15', warning: '#fb923c', critical: '#ef4444',
};

export default function WaterDashboard() {
    const [locality, setLocality] = useState('All India');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        const loc = locality === 'All India' ? '' : locality;
        try {
            const [news, trendData] = await Promise.all([
                newsApi.getAll({ category: 'water', locality: loc }),
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
                <section className="relative rounded-3xl overflow-hidden border border-cyan-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-cyan-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.15),transparent_70%)]" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-4xl">🌊</span>
                            <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Water Quality Monitor</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Water Pollution Dashboard</h1>
                        <p className="text-cyan-300 text-sm">River, lake and groundwater news for {locality}</p>
                    </div>
                </section>

                {/* Water Quality Indicators */}
                <section>
                    <h2 className="text-base font-semibold text-white mb-3">💧 Water Quality Snapshot</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {WATER_INDICATORS.map((ind) => (
                            <div key={ind.label} className="glass-card p-5 border" style={{ borderColor: STATUS_COLORS[ind.status] + '33' }}>
                                <div className="text-2xl mb-2">{ind.icon}</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black" style={{ color: STATUS_COLORS[ind.status] }}>{ind.value}</span>
                                    {ind.unit && <span className="text-xs text-slate-500">{ind.unit}</span>}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{ind.label}</p>
                                <span
                                    className="badge mt-2 text-xs"
                                    style={{ backgroundColor: STATUS_COLORS[ind.status] + '22', color: STATUS_COLORS[ind.status], border: `1px solid ${STATUS_COLORS[ind.status]}44` }}
                                >
                                    {ind.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trend Chart */}
                {trends.length > 0 && (
                    <section className="chart-container">
                        <h2 className="text-base font-semibold text-white mb-4">📈 Water Pollution Trend</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                <Area type="monotone" dataKey="water" stroke="#22d3ee" strokeWidth={2} fill="url(#waterGrad)" dot={{ fill: '#22d3ee', r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </section>
                )}

                {/* News */}
                <section>
                    <h2 className="section-title">🌊 Water Pollution News</h2>
                    <p className="section-subtitle">Water quality news and updates — {locality}</p>
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
                            <div className="text-3xl mb-2">🌊</div>
                            <p>No water articles yet. Fetch news from the main dashboard.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
