'use client';

import { useState, useEffect } from 'react';
import { CommunityPost, CATEGORY_THEMES } from '@/lib/types';
import { communityApi, authApi } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

interface Props {
    post: CommunityPost;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function InstagramPostModal({ post, onClose, onUpdate }: Props) {
    const theme = CATEGORY_THEMES[post.category] ?? CATEGORY_THEMES.general;
    const { user } = useAuth();

    // Fallbacks
    const currentUserId = user?.uid || user?.id || 'guest-user';
    const currentUserName = user?.userName || user?.displayName || 'Guest User';
    // Hide follow button only when the logged in user IS the post author
    const isOwnPost = !!user && user?.userName === post.userName;

    // Local state for instant UI updates
    const [likes, setLikes] = useState(post.likes);
    const [liked, setLiked] = useState(post.likedBy?.includes(currentUserId) ?? false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [acting, setActing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Check follow state on mount (only for other users' non-anonymous posts)
    useEffect(() => {
        if (!user || isOwnPost || !post.userName || !post.userId) return;
        authApi.getUserProfile(post.userName)
            .then(profile => {
                const followers: string[] = (profile as any).followers || [];
                setIsFollowing(followers.includes(user.id || user.uid || ''));
            })
            .catch(() => { });
    }, [user, post.userName, isOwnPost]);

    // Media resolving (videos/images)
    const mediaUrls = post.mediaUrls || ((post as any).imageUrl ? [(post as any).imageUrl] : []);
    const hasMedia = mediaUrls.length > 0;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (d > 0) return `${d} DAYS AGO`;
        const h = Math.floor(diff / (1000 * 60 * 60));
        if (h > 0) return `${h} HOURS AGO`;
        return 'JUST NOW';
    };

    const handleLike = async () => {
        try {
            const res = await communityApi.likePost(post.id, currentUserId);
            setLikes(res.likes);
            setLiked((prev) => !prev);
            onUpdate?.();
        } catch {
            setLikes((l) => liked ? l - 1 : l + 1);
            setLiked((prev) => !prev);
        }
    };

    const handleFollow = async () => {
        if (!user || !post.userName || followLoading) return;
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await authApi.unfollowUser(post.userName);
                setIsFollowing(false);
            } else {
                await authApi.followUser(post.userName);
                setIsFollowing(true);
            }
        } catch {
            // revert optimistic update on error
            setIsFollowing(prev => !prev);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || acting) return;
        setActing(true);

        try {
            const newComment = {
                userId: currentUserId,
                userName: currentUserName,
                text: commentText,
                createdAt: new Date().toISOString()
            };

            await communityApi.addComment(post.id, newComment);
            setComments(prev => [...prev, newComment]);
            setCommentText('');
            onUpdate?.();
        } catch {
            // handle silently
        } finally {
            setActing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8" onClick={onClose}>
            {/* Modal Container */}
            <div
                className="bg-[#0B1120] border border-white/10 rounded-xl md:rounded-r-xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl max-h-[90vh] shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >

                {/* Close Button (Mobile) */}
                <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white">
                    ✕
                </button>

                {/* Left Side: Media */}
                <div className="w-full md:w-[55%] lg:w-[60%] bg-black flex items-center justify-center relative min-h-[300px] md:min-h-0 border-r border-white/10">
                    {hasMedia ? (
                        <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                            {mediaUrls.map((url, i) => {
                                const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('video');
                                return (
                                    <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black">
                                        {isVideo ? (
                                            <video src={url} controls className="max-w-full max-h-[90vh] object-contain" />
                                        ) : (
                                            <img src={url} alt="Post media" className="max-w-full max-h-[90vh] object-contain" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${theme.gradient} p-8 text-center`}>
                            <div className="text-6xl mb-4">{theme.icon}</div>
                            <h2 className="text-2xl font-bold text-white max-w-md">{post.title}</h2>
                        </div>
                    )}
                </div>

                {/* Right Side: Details & Comments */}
                <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col h-full max-h-[50vh] md:max-h-[90vh] bg-[#0B1120] relative">

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                        <Link href={post.userId ? `/u/${post.userName}` : '#'} onClick={onClose} className="flex items-center gap-3 hover:opacity-80">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                style={{ backgroundColor: theme.primary + '22', color: theme.primary }}
                            >
                                {post.userName[0]?.toUpperCase()}
                            </div>
                            <div>
                                <span className="font-semibold text-white text-sm">{post.userName}</span>
                            </div>
                        </Link>

                        {/* Follow / Unfollow Button */}
                        {!isOwnPost && user && post.userId && (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`ml-2 px-3 py-1 rounded-lg text-xs font-bold tracking-wide transition-all ${isFollowing
                                    ? 'bg-white/10 text-slate-300 border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                    } disabled:opacity-50`}
                            >
                                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}

                        <button onClick={onClose} className="hidden md:block text-slate-400 hover:text-white p-1">
                            ✕
                        </button>
                    </div>

                    {/* Scrollable Comments & Description Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">

                        {/* Original Post Description */}
                        <div className="flex gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1"
                                style={{ backgroundColor: theme.primary + '22', color: theme.primary }}
                            >
                                {post.userName[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm text-slate-200">
                                    <span className="font-semibold text-white mr-2">{post.userName}</span>
                                    {post.title && <span className="font-bold block mb-1">{post.title}</span>}
                                    {post.description}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 font-medium tracking-wide uppercase">
                                    {timeAgo(post.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* List of Comments */}
                        {comments.map((c, i) => (
                            <div key={i} className="flex gap-3">
                                <Link href={`/u/${c.userName || 'anonymous'}`} onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 mt-1 hover:opacity-80 text-slate-300">
                                    {(c.userName || 'A')[0]?.toUpperCase()}
                                </Link>
                                <div>
                                    <p className="text-sm text-slate-300">
                                        <Link href={`/u/${c.userName || 'anonymous'}`} onClick={onClose} className="font-semibold text-white mr-2 hover:underline">
                                            {c.userName || 'Anonymous'}
                                        </Link>
                                        {c.text}
                                    </p>
                                    <div className="flex gap-3 mt-1 text-xs text-slate-500 font-medium tracking-wide">
                                        <span>{timeAgo(c.createdAt || new Date().toISOString())}</span>
                                        <button className="hover:text-slate-300">Reply</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-white/10 shrink-0 bg-[#0B1120]">

                        {/* Action Icons */}
                        <div className="p-4 pb-2 flex items-center gap-4">
                            <button onClick={handleLike} className="text-2xl hover:scale-110 transition-transform active:scale-90">
                                {liked ? '❤️' : '🤍'}
                            </button>
                            <label htmlFor="comment-input" className="text-2xl hover:scale-110 transition-transform cursor-pointer">
                                💬
                            </label>
                            <button className="text-2xl hover:scale-110 transition-transform">
                                📤
                            </button>

                            <div className="ml-auto text-xl hover:scale-110 transition-transform cursor-pointer">
                                🔖
                            </div>
                        </div>

                        {/* Likes Info */}
                        <div className="px-4 pb-3">
                            <p className="font-semibold text-sm text-white">
                                {likes} {likes === 1 ? 'like' : 'likes'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium tracking-wide">
                                {timeAgo(post.createdAt)}
                            </p>
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleComment} className="flex items-center px-4 py-3 border-t border-white/10">
                            <input
                                id="comment-input"
                                type="text"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500"
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || acting}
                                className={`text-sm font-semibold ml-2 transition-colors ${commentText.trim() ? 'text-blue-500' : 'text-blue-900/50 cursor-not-allowed'}`}
                            >
                                Post
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* Close Button UI (Desktop outer) */}
            <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-white text-3xl font-light hover:scale-110 transition-transform">
                ✕
            </button>
        </div>
    );
}
