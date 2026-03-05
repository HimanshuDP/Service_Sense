'use client';

import { CommunityPost, CATEGORY_THEMES, VerificationStatus } from '@/lib/types';
import { useState } from 'react';
import Link from 'next/link';
import { communityApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

interface Props {
    post: CommunityPost;
    onUpdate?: () => void;
}

const BADGE_MAP: Record<VerificationStatus, { label: string; color: string; icon: string }> = {
    valid: { label: 'AI Verified', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✅' },
    needs_review: { label: 'Under Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
    invalid: { label: 'Not Relevant', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
};

export default function CommunityPostCard({ post, onUpdate }: Props) {
    const theme = CATEGORY_THEMES[post.category] ?? CATEGORY_THEMES.general;
    const badge = BADGE_MAP[post.aiVerification];
    const { user } = useAuth();

    // Fallbacks
    const currentUserId = user?.uid || 'guest-user';
    const currentUserName = user?.userName || user?.displayName || 'Guest User';

    const [showComment, setShowComment] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [likes, setLikes] = useState(post.likes);
    const [liked, setLiked] = useState((post.likedBy ?? []).includes(currentUserId));
    const [commenting, setCommenting] = useState(false);

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3_600_000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const handleLike = async () => {
        try {
            const res = await communityApi.likePost(post.id, currentUserId);
            setLikes(res.likes);
            setLiked((prev) => !prev);
        } catch {
            setLikes((l) => liked ? l - 1 : l + 1);
            setLiked((prev) => !prev);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        setCommenting(true);
        try {
            await communityApi.addComment(post.id, {
                userId: currentUserId,
                userName: currentUserName,
                text: commentText,
            });
            setCommentText('');
            setShowComment(false);
            onUpdate?.();
        } catch {
            /* silent */
        } finally {
            setCommenting(false);
        }
    };

    return (
        <div className="glass-card-hover flex flex-col gap-4 p-5 relative overflow-hidden group">
            {/* Subtle background glow */}
            <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${theme.gradient} pointer-events-none`}
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 relative">
                {post.userId ? (
                    <Link href={`/u/${post.userName}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                            style={{ backgroundColor: theme.primary + '22', color: theme.primary }}
                        >
                            {post.userName[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-tight hover:underline">{post.userName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                📍 {post.locality} · {timeAgo(post.createdAt)}
                            </p>
                        </div>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                            style={{ backgroundColor: '#64748b22', color: '#64748b' }}
                        >
                            🕵️
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-400 leading-tight">Anonymous</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                📍 {post.locality} · {timeAgo(post.createdAt)}
                            </p>
                        </div>
                    </div>
                )}

                {/* AI badge */}
                <span className={`badge border ${badge.color}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>

            {/* Content */}
            <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{theme.icon}</span>
                    <span
                        className="badge"
                        style={{ backgroundColor: theme.primary + '22', color: theme.primary, border: `1px solid ${theme.primary}44` }}
                    >
                        {theme.name}
                    </span>
                </div>
                <h3 className="font-semibold text-slate-100 text-sm leading-snug mb-1">{post.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-3">{post.description}</p>
            </div>

            {/* Media Carousel */}
            {(post.mediaUrls?.length || (post as any).imageUrl) && (
                <div className="relative -mx-5 px-5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
                    {(post.mediaUrls || ((post as any).imageUrl ? [(post as any).imageUrl] : [])).map((url: string, i: number) => {
                        const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('video');
                        return (
                            <div key={i} className="relative aspect-[4/3] w-[260px] shrink-0 snap-center rounded-xl overflow-hidden bg-black/40 border border-white/5">
                                {isVideo ? (
                                    <video src={url} controls controlsList="nodownload" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={url} alt="Community Report" loading="lazy" className="w-full h-full object-cover" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Credibility bar */}
            <div className="flex items-center gap-2 relative">
                <span className="text-xs text-slate-500">Credibility:</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${post.credibilityScore * 100}%`, backgroundColor: theme.primary }}
                    />
                </div>
                <span className="text-xs font-bold" style={{ color: theme.primary }}>
                    {(post.credibilityScore * 100).toFixed(0)}%
                </span>
            </div>

            {/* Impact updates */}
            {(post.updates?.length ?? 0) > 0 && (
                <div className="relative bg-white/5 rounded-xl p-3 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1">📸 Latest Update:</p>
                    <p className="line-clamp-2">{post.updates![post.updates!.length - 1].text}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-1 border-t border-white/5 relative">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
                        }`}
                >
                    {liked ? '❤️' : '🤍'} <span>{likes}</span>
                </button>

                <button
                    onClick={() => setShowComment((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
                >
                    💬 <span>{post.comments?.length ?? 0}</span>
                </button>

                <span className="ml-auto text-xs text-slate-600">
                    {post.verificationReason && `"${post.verificationReason.slice(0, 40)}..."`}
                </span>
            </div>

            {/* Comment input */}
            {showComment && (
                <div className="flex gap-2 relative">
                    <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="input-field text-xs py-2"
                        onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    />
                    <button
                        onClick={handleComment}
                        disabled={commenting}
                        className="btn-primary text-xs py-2 px-3"
                    >
                        {commenting ? '...' : 'Post'}
                    </button>
                </div>
            )}

            {/* Comments */}
            {(post.comments ?? []).slice(-2).map((c, i) => (
                <div key={i} className="bg-white/5 rounded-xl px-3 py-2 text-xs text-slate-400 relative">
                    <span className="font-medium text-slate-300">{c.userName || 'Anonymous'}: </span>
                    {c.text}
                </div>
            ))}
        </div>
    );
}
