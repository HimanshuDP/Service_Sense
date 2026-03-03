'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { analyticsApi } from '@/lib/api';
import { HeatmapPoint, CATEGORY_THEMES } from '@/lib/types';

// Leaflet must be dynamically imported (no SSR)
const MapComponent = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function HeatmapPage() {
    const [locality, setLocality] = useState('All India');
    const [points, setPoints] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [catFilter, setCatFilter] = useState('all');

    useEffect(() => {
        setLoading(true);
        analyticsApi.getHeatmap()
            .then((res) => setPoints(res.points))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = catFilter === 'all' ? points : points.filter(p => p.category === catFilter);

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar locality={locality} onLocalityChange={setLocality} />
            <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-6">

                {/* Hero */}
                <section className="relative rounded-3xl overflow-hidden border border-teal-500/20 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-950/80 via-teal-900/50 to-slate-900" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.12),transparent_70%)]" />
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-4xl">🗺️</span>
                            <span className="badge bg-teal-500/10 text-teal-400 border border-teal-500/20">Environmental Heatmap</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Issue Hotspot Map</h1>
                        <p className="text-teal-300 text-sm">Geographic distribution of ML-classified environmental issues across India</p>
                    </div>
                </section>

                {/* Category filter + legend */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setCatFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
              ${catFilter === 'all' ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'border-white/10 text-slate-400 hover:text-white'}`}
                    >
                        🌍 All
                    </button>
                    {Object.entries(CATEGORY_THEMES).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => setCatFilter(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                ${catFilter === key
                                    ? 'border-opacity-50 text-white'
                                    : 'border-white/10 text-slate-400 hover:text-white'}`}
                            style={catFilter === key ? { backgroundColor: theme.primary + '22', borderColor: theme.primary + '66', color: theme.primary } : {}}
                        >
                            <span>{theme.icon}</span>
                            <span>{theme.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                {/* Map */}
                <div className="glass-card overflow-hidden" style={{ height: 480 }}>
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                            Loading map data...
                        </div>
                    ) : (
                        <MapComponent points={filtered} />
                    )}
                </div>

                {/* Locality table */}
                <section>
                    <h2 className="text-base font-semibold text-white mb-3">📊 Hotspot Rankings</h2>
                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/10">
                                <tr className="text-slate-500 text-xs">
                                    <th className="text-left px-5 py-3">#</th>
                                    <th className="text-left px-5 py-3">Locality</th>
                                    <th className="text-left px-5 py-3">Primary Issue</th>
                                    <th className="text-left px-5 py-3">Reports</th>
                                    <th className="text-left px-5 py-3">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...filtered].sort((a, b) => b.count - a.count).map((p, i) => {
                                    const theme = CATEGORY_THEMES[p.category] ?? CATEGORY_THEMES.general;
                                    const max = filtered[0]?.count ?? 1;
                                    return (
                                        <tr key={p.locality} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-3 text-slate-600 font-mono">{i + 1}</td>
                                            <td className="px-5 py-3 font-medium text-white">📍 {p.locality}</td>
                                            <td className="px-5 py-3">
                                                <span className="badge" style={{ backgroundColor: theme.primary + '22', color: theme.primary, border: `1px solid ${theme.primary}44` }}>
                                                    {theme.icon} {theme.name}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-bold" style={{ color: theme.primary }}>{p.count}</td>
                                            <td className="px-5 py-3">
                                                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, backgroundColor: theme.primary }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <p className="text-center text-slate-500 py-8">No hotspot data available for this filter.</p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
