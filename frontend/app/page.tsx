'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewsCard from '@/components/NewsCard';
import { newsApi, analyticsApi } from '@/lib/api';
import { NewsArticle, CATEGORY_THEMES } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const STAT_CARDS = [
  { key: 'totalNews', label: 'News Articles', icon: '📰', color: '#60a5fa' },
  { key: 'totalCommunityPosts', label: 'Community Reports', icon: '🤝', color: '#4ade80' },
  { key: 'validatedPosts', label: 'Verified Reports', icon: '✅', color: '#22d3ee' },
  { key: 'localitiesCovered', label: 'Cities Tracked', icon: '📍', color: '#fb923c' },
];

const PIE_COLORS = ['#60a5fa', '#22d3ee', '#4ade80', '#fb923c', '#a78bfa'];
const CAT_LABELS: Record<string, string> = {
  air: 'Air', water: 'Water', land: 'Land', waste: 'Waste', general: 'General',
};

export default function HomePage() {
  const [locality, setLocality] = useState('All India');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const localityParam = locality === 'All India' ? '' : locality;

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsApi.getAll({ locality: localityParam, page, search, timeFilter });
      setArticles(res.articles);
      setTotal(res.total);
    } catch { /* backend offline */ }
    setLoading(false);
  }, [localityParam, page, search, timeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const [s, stats] = await Promise.all([analyticsApi.getSummary(), newsApi.getStats()]);
      setSummary(s);
      const dist = Object.entries(stats.distribution).map(([cat, count]) => ({
        name: CAT_LABELS[cat] || cat,
        value: count,
        fill: PIE_COLORS[Object.keys(CAT_LABELS).indexOf(cat)] || '#60a5fa',
      }));
      setDistribution(dist);
    } catch { /* backend offline */ }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const handleFetch = async () => {
    setFetching(true);
    try {
      await newsApi.fetchAndClassify('', localityParam);
      await loadArticles();
      await loadStats();
    } catch { /* backend offline */ }
    setFetching(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar locality={locality} onLocalityChange={(l) => { setLocality(l); setPage(1); }} />

      <main className="mx-auto max-w-screen-xl px-4 py-8 space-y-10">
        {/* Hero */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-green-950/30 to-slate-900 border border-white/10 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,222,128,0.12),transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">
                🔬 TRL-4 Prototype
              </span>
              <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">
                🤖 AI-Powered
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Environmental<br />
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                ServiceSense Platform
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mb-6">
              Transforming <strong className="text-slate-200">Environmental News</strong> → <strong className="text-slate-200">Structured Intelligence</strong> → <strong className="text-slate-200">Local Community Action</strong> through custom ML classification and AI insights.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleFetch} disabled={fetching} className="btn-primary">
                {fetching ? '⚙️ Fetching...' : '🔄 Fetch & Classify News'}
              </button>
              <a href="/dashboard/community" className="btn-ghost border border-white/10">
                🤝 View Community Reports
              </a>
            </div>
          </div>
        </section>

        {/* Stat Cards */}
        {summary && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map((s) => (
              <div key={s.key} className="stat-card">
                <div className="text-2xl">{s.icon}</div>
                <div className="text-3xl font-bold" style={{ color: s.color }}>
                  {summary[s.key] ?? 0}
                </div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Charts */}
        {distribution.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="chart-container">
              <h2 className="text-base font-semibold text-white mb-4">📊 Category Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distribution} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {distribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2 className="text-base font-semibold text-white mb-4">🥧 Category Share</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" cx="45%" cy="50%" outerRadius={75} paddingAngle={3}>
                    {distribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Category Nav Cards */}
        <section>
          <h2 className="section-title">🌿 Explore by Category</h2>
          <p className="section-subtitle">Each dashboard has theme-specific visuals and data</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(CATEGORY_THEMES).map(([key, theme]) => (
              <a
                key={key}
                href={`/dashboard/${key === 'general' ? '' : key}`}
                className="glass-card-hover flex flex-col items-center gap-2 p-5 text-center group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{theme.icon}</span>
                <span className="text-xs font-semibold" style={{ color: theme.primary }}>{theme.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* News Feed */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="section-title mb-1">📰 Latest Environmental News</h2>
              <p className="section-subtitle mb-0">
                {total > 0
                  ? `${total} articles · ${locality}`
                  : 'Click "Fetch & Classify News" to load articles'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search keywords..."
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors w-40 md:w-56"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(searchInput);
                    setPage(1);
                  }
                }}
              />
              <button
                onClick={() => { setSearch(searchInput); setPage(1); }}
                className="btn-ghost border border-white/10 px-3 py-2 text-sm"
              >
                Search
              </button>
              <select
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All Time</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card h-48 animate-pulse" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((a) => <NewsCard key={a.id} article={a} />)}
              </div>
              {total > 24 && (
                <div className="flex justify-center gap-3 mt-6">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost border border-white/10">← Prev</button>
                  <span className="text-sm text-slate-500 flex items-center">Page {page} of {Math.ceil(total / 24)}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 24)} className="btn-ghost border border-white/10">Next →</button>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-12 text-center text-slate-500">
              <div className="text-4xl mb-3">🌱</div>
              <p className="font-medium">No articles yet</p>
              <p className="text-sm mt-1">Click "Fetch & Classify News" above to collect and classify environmental news.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
