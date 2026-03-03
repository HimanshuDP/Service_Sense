'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { analyticsApi } from '@/lib/api';
import { TrendPoint } from '@/lib/types';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend,
} from 'recharts';

const SERIES = [
    { key: 'air', name: 'Air', color: '#60a5fa' },
    { key: 'water', name: 'Water', color: '#22d3ee' },
    { key: 'land', name: 'Land', color: '#4ade80' },
    { key: 'waste', name: 'Waste', color: '#fb923c' },
    { key: 'general', name: 'General', color: '#a78bfa' },
];

export default function AnalyticsDashboard() {
    const [locality, setLocality] = useState('All India');
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [months, setMonths] = useState(6);
    const [loading, setLoading] = useState(false);

    const loadTrends = useCallback(async () => {
        setLoading(true);
        try {
            const res = await analyticsApi.getTrends(months);
            setTrends(res.trends);
        } catch { /* backend offline */ }
        setLoading(false);
    }, [months]);

    useEffect(() => { loadTrends(); }, [loadTrends]);

    // Compute totals for summary
    const totals = SERIES.map((s) => ({
        ...s,
        total: trends.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0),
    })).sort((a, b) => b.total - a.total);

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar locality={locality} onLocalityChange={setLocality} />
            <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-8">

                {/* Hero */}
                <section className="relative rounded-3xl overflow-hidden border border-purple-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/80 via-purple-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_70%)]" />
                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-4xl">📊</span>
                                <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20">Trends & Insights</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Monthly Trend Analytics</h1>
                            <p className="text-purple-300 text-sm">How environmental issues have changed over time, month by month</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {[3, 6, 12].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMonths(m)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                    ${months === m
                                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                                            : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                                >
                                    {m}M
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Top category summary */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {totals.map((t) => (
                        <div key={t.key} className="glass-card p-4 text-center">
                            <div className="text-2xl font-black" style={{ color: t.color }}>{t.total}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{t.name}</div>
                            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${Math.min((t.total / Math.max(1, totals[0].total)) * 100, 100)}%`, backgroundColor: t.color }}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Multi-line trend chart */}
                {loading ? (
                    <div className="chart-container h-72 animate-pulse" />
                ) : trends.length > 0 && (
                    <>
                        <section className="chart-container">
                            <h2 className="text-base font-semibold text-white mb-4">📈 Issue Trends Over Time</h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                    {SERIES.map((s) => (
                                        <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3, fill: s.color }} activeDot={{ r: 5 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </section>

                        {/* Stacked bar chart */}
                        <section className="chart-container">
                            <h2 className="text-base font-semibold text-white mb-4">📊 Monthly Breakdown</h2>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                    {SERIES.map((s) => (
                                        <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color} radius={s.key === 'general' ? [4, 4, 0, 0] : undefined} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                    </>
                )}

                {/* Insight Cards */}
                <section>
                    <h2 className="section-title">💡 Key Insights</h2>
                    <p className="section-subtitle">What the data is telling us right now</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                icon: '📈',
                                title: 'Air Issues Rising',
                                desc: 'Air pollution reports show an upward trend — particularly in metro areas during winter months.',
                                color: '#60a5fa',
                            },
                            {
                                icon: '🌊',
                                title: 'Water Concerns Stable',
                                desc: 'Water pollution reports remain consistently high, with river contamination dominating the category.',
                                color: '#22d3ee',
                            },
                            {
                                icon: '♻️',
                                title: 'Waste Coverage Growing',
                                desc: 'Waste management news is increasing — driven by plastic ban enforcement and e-waste awareness.',
                                color: '#fb923c',
                            },
                        ].map((card) => (
                            <div key={card.title} className="glass-card p-5">
                                <div className="text-2xl mb-2">{card.icon}</div>
                                <h3 className="font-semibold text-white text-sm mb-1">{card.title}</h3>
                                <p className="text-xs text-slate-400">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
