'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/EditProfileModal';
import { communityApi } from '@/lib/api';
import { CommunityPost } from '@/lib/types';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [showEdit, setShowEdit] = useState(false);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map(post => (
                                <div key={post.id} className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col h-full bg-slate-900/50">
                                    <h3 className="font-semibold text-white mb-2 line-clamp-1">{post.title}</h3>
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">{post.description}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-white/5">
                                        <span>❤️ {post.likes}</span>
                                        <span>💬 {post.comments?.length || 0}</span>
                                    </div>
                                </div>
                            ))}
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
        </div>
    );
}
