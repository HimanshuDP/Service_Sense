'use client';

import { NewsArticle, CATEGORY_THEMES } from '@/lib/types';
import { useState } from 'react';

interface Props {
    article: NewsArticle;
}

const CONFIDENCE_COLOR = (c: number) => {
    if (c >= 0.8) return 'text-green-400';
    if (c >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
};

export default function NewsCard({ article }: Props) {
    const [expanded, setExpanded] = useState(false);
    const theme = CATEGORY_THEMES[article.category] ?? CATEGORY_THEMES.general;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3_600_000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    return (
        <div className="glass-card-hover flex flex-col gap-3 p-5 relative overflow-hidden group">
            {/* Background glow */}
            <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${theme.gradient} pointer-events-none`}
            />

            {/* Image */}
            {article.urlToImage && (
                <div className="relative -mx-5 -mt-5 mb-1 h-40 overflow-hidden">
                    <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3 relative">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl">{theme.icon}</span>
                    <span
                        className="badge"
                        style={{ backgroundColor: theme.primary + '22', color: theme.primary, border: `1px solid ${theme.primary}44` }}
                    >
                        {theme.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    {article.locality && (
                        <span className="flex items-center gap-1">
                            📍 {article.locality}
                        </span>
                    )}
                    <span title={new Date(article.publishedAt).toLocaleString()}>
                        {new Date(article.publishedAt).toLocaleDateString()} • {timeAgo(article.publishedAt)}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug text-slate-100 line-clamp-2 relative">
                {article.title}
            </h3>


            {/* AI Summary */}
            {article.summary && (
                <p className="text-xs text-slate-400 line-clamp-2 relative">{article.summary}</p>
            )}

            {/* Actions (collapsible) */}
            {article.actions.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        className="text-xs font-medium flex items-center gap-1 transition-colors"
                        style={{ color: theme.primary }}
                    >
                        {expanded ? '▲ Hide Actions' : '▼ What can I do?'}
                    </button>
                    {expanded && (
                        <ul className="mt-2 space-y-1">
                            {article.actions.map((action, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span style={{ color: theme.primary }} className="mt-0.5 shrink-0">✓</span>
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 relative">
                <span className="text-xs text-slate-600">{article.source}</span>
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium transition-colors hover:underline"
                    style={{ color: theme.primary }}
                >
                    Read →
                </a>
            </div>
        </div>
    );
}
