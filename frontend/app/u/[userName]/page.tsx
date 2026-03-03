'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { authApi, communityApi } from '@/lib/api';
import { User, CommunityPost } from '@/lib/types';
import CommunityPostCard from '@/components/CommunityPostCard';
import InstagramPostModal from '@/components/InstagramPostModal';

export default function PublicProfilePage() {
    const params = useParams();
    const userName = params.userName as string;
    const { user: currentUser, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState<User | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Fetch user public profile
                const p = await authApi.getUserProfile(userName);
                setProfile(p);

                // Check if current user is already following
                // Since our API currently doesn't return `following` arrays directly to the client
                // for security, we'll try a local optimistic state based on stats, or assume `false` 
                // until we hit the follow button. For fully accurate state, the `getMe()` response 
                // should have a `following` list we can check against `p.id`.
                if (currentUser) {
                    const me = await authApi.getMe();
                    // Just do a basic check if it exists in a custom field (assuming we'd add it to User API)
                    // We will rely on returning "already_following" from the API or local state tracking.
                }

                // 2. Fetch all posts and filter by this user
                const res = await communityApi.getAll();
                const userPosts = res.posts.filter((post: any) => post.userName === userName && !post.isAnonymous);
                setPosts(userPosts);

            } catch (err: any) {
                setError('User not found or an error occurred.');
            } finally {
                setLoading(false);
            }
        };

        if (userName) fetchProfile();
    }, [userName, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            alert("Please log in to follow users.");
            return;
        }
        if (!profile) return;

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await authApi.unfollowUser(profile.userName);
                setProfile(p => p ? { ...p, followersCount: (p.followersCount || 0) - 1 } : null);
                setIsFollowing(false);
            } else {
                const res = await authApi.followUser(profile.userName);
                if (res.status === 'already_following') {
                    setIsFollowing(true);
                } else {
                    setProfile(p => p ? { ...p, followersCount: (p.followersCount || 0) + 1 } : null);
                    setIsFollowing(true);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-r-transparent border-white animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <h1 className="text-4xl mb-4">🕵️‍♂️</h1>
                    <p className="text-lg">User not found</p>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.userName === profile.userName;

    return (
        <div className="min-h-screen pt-12 pb-24 px-4 bg-[#0B1120]">
            <div className="max-w-4xl mx-auto">
                <div className="glass-panel p-6 md:p-10 mb-8 border border-white/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-900/40 to-emerald-900/20" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            {profile.photoURL ? (
                                <img
                                    src={profile.photoURL}
                                    alt="Profile"
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0B1120] shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-[#0B1120]">
                                    {(profile.displayName || profile.userName || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 w-full text-center md:text-left mt-4 md:mt-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-1">
                                        {profile.displayName || profile.userName}
                                    </h1>
                                    <p className="text-blue-400">@{profile.userName}</p>
                                </div>
                                {!isOwnProfile && (
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors border ${isFollowing
                                            ? 'border-white/20 bg-transparent hover:bg-white/10 text-white'
                                            : 'border-transparent bg-blue-600 hover:bg-blue-500 text-white'
                                            }`}
                                    >
                                        {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex justify-center md:justify-start gap-6 mb-6">
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{posts.length}</span>
                                    <span className="text-sm text-slate-400">Posts</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{profile.followersCount || 0}</span>
                                    <span className="text-sm text-slate-400">Followers</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="block font-bold text-lg">{profile.followingCount || 0}</span>
                                    <span className="text-sm text-slate-400">Following</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="max-w-xl">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {profile.bio || "No bio provided."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <div>
                    <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Community Posts</h2>
                    {posts.length > 0 ? (
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
                            <h3 className="text-lg font-medium text-slate-300 mb-2">No public posts yet</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* Instagram Style Post Modal */}
            {selectedPost && (
                <InstagramPostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    // To fetch updated comment/like counts for grid
                    onUpdate={() => {
                        communityApi.getAll().then(res => {
                            const userPosts = res.posts.filter((p: any) => p.userName === userName && !p.isAnonymous);
                            setPosts(userPosts);
                            setSelectedPost(userPosts.find((p: any) => p.id === selectedPost.id) || null);
                        });
                    }}
                />
            )}
        </div>
    );
}
