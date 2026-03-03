'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import { newsApi, analyticsApi } from '@/lib/api';
import { NewsArticle, TrendPoint } from '@/lib/types';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const THEME = {
    primary: '#60a5fa',
    secondary: '#93c5fd',
    bg: 'from-blue-950 via-blue-900 to-slate-900',
    gradient: 'from-blue-500/20 to-transparent',
    glow: 'glow-blue',
};

const AQI_LEVELS = [
    { label: 'Good', range: '0-50', color: '#4ade80', desc: 'Air quality is satisfactory' },
    { label: 'Moderate', range: '51-100', color: '#facc15', desc: 'Acceptable air quality' },
    { label: 'Unhealthy', range: '101-150', color: '#fb923c', desc: 'Sensitive groups affected' },
    { label: 'Very Unhealthy', range: '151-200', color: '#f87171', desc: 'Everyone may be affected' },
    { label: 'Hazardous', range: '201+', color: '#ef4444', desc: 'Emergency conditions' },
];

export default function AirDashboard() {
    const [locality, setLocality] = useState('All India');
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(false);
    // Simulated AQI value for demo
    const demoAqi = 178;

    const loadData = useCallback(async () => {
        setLoading(true);
        const loc = locality === 'All India' ? '' : locality;
        try {
            const [news, trendData] = await Promise.all([
                newsApi.getAll({ category: 'air', locality: loc }),
                analyticsApi.getTrends(6),
            ]);
            setArticles(news.articles);
            setTrends(trendData.trends);
        } catch { /* backend offline */ }
        setLoading(false);
    }, [locality]);

    useEffect(() => { loadData(); }, [loadData]);

    const aqiColor = demoAqi < 50 ? '#4ade80' : demoAqi < 100 ? '#facc15' : demoAqi < 150 ? '#fb923c' : demoAqi < 200 ? '#f87171' : '#ef4444';
    const aqiLabel = demoAqi < 50 ? 'Good' : demoAqi < 100 ? 'Moderate' : demoAqi < 150 ? 'Unhealthy' : demoAqi < 200 ? 'Very Unhealthy' : 'Hazardous';

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar locality={locality} onLocalityChange={setLocality} />
            <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-8">

                {/* Hero Banner */}
                <section className="relative rounded-3xl overflow-hidden border border-blue-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(96,165,250,0.15),transparent_70%)]" />
                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-4xl">💨</span>
                                <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">Air Quality Monitor</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Air Quality Dashboard</h1>
                            <p className="text-blue-300 text-sm">Latest air pollution news and tips to protect yourself — {locality}</p>
                        </div>

                        {/* AQI Circle */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                            <div
                                className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-xl"
                                style={{ borderColor: aqiColor, boxShadow: `0 0 30px ${aqiColor}44` }}
                            >
                                <span className="text-3xl font-black" style={{ color: aqiColor }}>{demoAqi}</span>
                                <span className="text-xs text-slate-400">AQI</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: aqiColor }}>{aqiLabel}</span>
                            <span className="text-xs text-slate-500">Sample value</span>
                        </div>
                    </div>
                </section>

                {/* AQI Scale */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {AQI_LEVELS.map((lvl) => (
                        <div key={lvl.label} className="glass-card p-4 text-center border" style={{ borderColor: lvl.color + '33' }}>
                            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: lvl.color }} />
                            <p className="text-xs font-bold text-white">{lvl.label}</p>
                            <p className="text-xs text-slate-500">{lvl.range}</p>
                        </div>
                    ))}
                </section>

                {/* Trend Chart */}
                {trends.length > 0 && (
                    <section className="chart-container">
                        <h2 className="text-base font-semibold text-white mb-4">📈 Air Pollution Trend (6 months)</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                <Area type="monotone" dataKey="air" stroke="#60a5fa" strokeWidth={2} fill="url(#airGrad)" dot={{ fill: '#60a5fa', r: 3 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </section>
                )}

                {/* News */}
                <section>
                    <h2 className="section-title">💨 Air Pollution News</h2>
                    <p className="section-subtitle">Air quality stories and updates — {locality}</p>
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
                            <div className="text-3xl mb-2">💨</div>
                            <p>No air pollution articles yet. Fetch news from the main dashboard.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
