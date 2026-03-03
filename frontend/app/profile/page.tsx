'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/EditProfileModal';
import { communityApi } from '@/lib/api';
import { CommunityPost } from '@/lib/types';
import InstagramPostModal from '@/components/InstagramPostModal';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [showEdit, setShowEdit] = useState(false);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

    // Hard redirect safely if unauthenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load mock posts to populate Instagram-like grid
    useEffect(() => {
        const fetchPosts = async () => {
            if (!user) return;
            try {
                const res = await communityApi.getAll();
                // Filter posts loosely by user name or ID (fallback for demo purposes)
                const userPosts = res.posts.filter((p: any) => p.userId === user.id || p.userName === user.userName);
                setPosts(userPosts);
            } catch (err) {
                console.error("Failed to load posts", err);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (user && !authLoading) {
            fetchPosts();
        }
    }, [user, authLoading]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-r-transparent border-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-12 pb-24 px-4 bg-[#0B1120]">
            <div className="max-w-4xl mx-auto">
                <div className="glass-panel p-6 md:p-10 mb-8 border border-white/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-900/40 to-purple-900/20" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0B1120] shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-[#0B1120]">
                                    {(user.displayName || user.userName || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 w-full text-center md:text-left mt-4 md:mt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-1">
                                        {user.displayName || user.userName}
                                    </h1>
                                    <p className="text-blue-400">@{user.userName}</p>
                                </div>
                                <button
                                    onClick={() => setShowEdit(true)}
                                    className="px-6 py-2 rounded-lg font-medium text-sm transition-colors border border-white/20 hover:bg-white/10"
                                >
                                    Edit Profile
                                </button>
                            </div>

                            {/* Instagram-style Stats */}
                            <div className="flex justify-center md:justify-start gap-6 mb-6">
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{posts.length}</span>
                                    <span className="text-sm text-slate-400">Posts</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{user.followersCount || 0}</span>
                                    <span className="text-sm text-slate-400">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{user.followingCount || 0}</span>
                                    <span className="text-sm text-slate-400">Following</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="max-w-xl">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {user.bio || "This user hasn't added a bio yet. They're too busy saving the environment! 🌍"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Grid Layout */}
                <div>
                    <div className="flex items-center gap-4 border-b border-white/10 mb-6">
                        <button className="px-4 py-3 text-sm font-medium border-b-2 border-white text-white uppercase tracking-wider">
                            Community Posts
                        </button>
                        <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-300 uppercase tracking-wider">
                            Saved
                        </button>
                    </div>

                    {loadingPosts ? (
                        <div className="flex justify-center p-12">
                            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-r-white animate-spin" />
                        </div>
                    ) : posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                            {posts.map(post => {
                                const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
                                const firstMedia = hasMedia ? post.mediaUrls![0] : ((post as any).imageUrl || null);
                                const isVideo = firstMedia && (firstMedia.includes('.mp4') || firstMedia.includes('video'));

                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => setSelectedPost(post)}
                                        className="relative aspect-square bg-slate-800 cursor-pointer group overflow-hidden md:rounded-xl"
                                    >
                                        {/* Thumbnail Image/Video or Placeholder */}
                                        {firstMedia ? (
                                            isVideo ? (
                                                <video src={firstMedia} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={firstMedia} alt="Post" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-2 text-center">
                                                <span className="text-3xl mb-2">🌿</span>
                                                <span className="text-[10px] md:text-sm font-semibold text-slate-300 line-clamp-2 leading-tight">{post.title}</span>
                                            </div>
                                        )}

                                        {/* Hover Overlay with Likes & Comments Count */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold backdrop-blur-sm">
                                            <div className="flex items-center gap-1.5"><span className="text-xl">❤️</span> {post.likes}</div>
                                            <div className="flex items-center gap-1.5"><span className="text-xl">💬</span> {post.comments?.length || 0}</div>
                                        </div>

                                        {/* Multiple images icon indicator if needed */}
                                        {post.mediaUrls && post.mediaUrls.length > 1 && (
                                            <div className="absolute top-2 right-2 text-white shadow-md">
                                                <svg aria-label="Carousel" className="x1lliihq x1n2onr6 x5n08af" fill="currentColor" height="22" role="img" viewBox="0 0 48 48" width="22"><path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.1-8.1 8.1H14.9c-1 0-2-.9-2-2s.9-2 2-2h16.1c2.3 0 4.1-1.8 4.1-4.1V15c0-1 .9-2 2-2s2 .9 2 2z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-4 glass-panel rounded-2xl border border-white/5">
                            <div className="text-6xl mb-4">🌱</div>
                            <h3 className="text-lg font-medium text-slate-300 mb-2">No posts yet</h3>
                            <p className="text-slate-500 text-sm">When you share community updates, they will appear here.</p>
                        </div>
                    )}
                </div>
            </div>

            {showEdit && (
                <EditProfileModal
                    onClose={() => setShowEdit(false)}
                    onUpdate={() => {
                        // After update, force a page reload to resync AuthContext 
                        // and trigger any layout updates.
                        window.location.reload();
                    }}
                />
            )}

            {/* Instagram Style Post Modal */}
            {selectedPost && (
                <InstagramPostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    // To fetch updated comment/like counts for grid
                    onUpdate={() => {
                        communityApi.getAll().then(res => {
                            const userPosts = res.posts.filter((p: any) => p.userId === user?.id || p.userName === user?.userName);
                            setPosts(userPosts);
                            setSelectedPost(userPosts.find((p: any) => p.id === selectedPost.id) || null);
                        });
                    }}
                />
            )}
        </div>
    );
}
