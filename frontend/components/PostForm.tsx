'use client';

import { useState, useRef } from 'react';
import { communityApi } from '@/lib/api';
import { EnvCategory } from '@/lib/types';
import { useAuth, createGuestUser } from '@/lib/AuthContext';

interface Props {
    onSuccess?: () => void;
}

const CATEGORIES: { value: EnvCategory; label: string; icon: string }[] = [
    { value: 'air', label: 'Air Pollution', icon: '💨' },
    { value: 'water', label: 'Water Pollution', icon: '🌊' },
    { value: 'land', label: 'Land / Forest', icon: '🌿' },
    { value: 'waste', label: 'Waste Management', icon: '♻️' },
    { value: 'general', label: 'General Environment', icon: '🌍' },
];

export default function PostForm({ onSuccess }: Props) {
    const { user, isDemo, logout } = useAuth();
    const [guestName, setGuestName] = useState('');
    const [guestMode, setGuestMode] = useState(false);  // show name-input step
    const [sessionUser, setSessionUser] = useState(user);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [form, setForm] = useState({
        title: '', description: '', category: 'general' as EnvCategory, locality: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ status: string; message: string } | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    // Resolved user (either real Firebase user or demo session user)
    const activeUser = sessionUser || user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUser) return;
        if (!form.title.trim() || !form.description.trim() || !form.locality.trim()) return;

        setSubmitting(true);
        setResult({ status: 'info', message: 'Uploading media...' });

        try {
            let mediaUrls: string[] = [];
            if (!isDemo && files.length > 0) {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

                if (!cloudName || !uploadPreset || cloudName.includes('your_cloud_name_here')) {
                    throw new Error('Cloudinary credentials not configured yet.');
                }

                const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

                const uploadPromises = files.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', uploadPreset);

                    const response = await fetch(cloudinaryUrl, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) throw new Error('Failed to upload media');
                    const data = await response.json();
                    return data.secure_url;
                });
                mediaUrls = await Promise.all(uploadPromises);
            } else if (isDemo && files.length > 0) {
                // In demo mode, we just mock the URLs since users don't have storage access
                mediaUrls = files.map(() => 'https://via.placeholder.com/400x300?text=Demo+Media');
            }

            setResult({ status: 'info', message: 'Analyzing report...' });

            const res = await communityApi.createPost({
                userId: activeUser.uid,
                userName: activeUser.displayName || activeUser.email || 'Anonymous',
                title: form.title,
                description: form.description,
                category: form.category,
                locality: form.locality,
                mediaUrls,
                isAnonymous,
            });
            const statusEmoji: Record<string, string> = {
                valid: '✅', needs_review: '⏳', invalid: '❌',
            };
            const verificationStr = res.aiVerification || 'needs_review';
            setResult({
                status: verificationStr,
                message: `Post submitted! AI says: ${statusEmoji[verificationStr] ?? '⚙️'} ${verificationStr.replace('_', ' ')}`,
            });
            setForm({ title: '', description: '', category: 'general', locality: '' });
            setFiles([]);
            onSuccess?.();
        } catch (error: any) {
            setResult({ status: 'error', message: error.message || 'Failed to submit. Please check if the backend is running.' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── DEMO MODE: guest name step ──────────────────────────────────────────
    if (isDemo && !activeUser) {
        return (
            <div className="glass-card p-8 space-y-5">
                <div className="text-center">
                    <div className="text-3xl mb-2">👤</div>
                    <h3 className="text-lg font-bold text-white">Enter your name to post</h3>
                    <p className="text-sm text-slate-400 mt-1">Demo mode — no sign-in required</p>
                </div>
                <div className="flex gap-3">
                    <input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && guestName.trim()) {
                                setSessionUser(createGuestUser(guestName.trim()));
                            }
                        }}
                        placeholder="Your name (e.g. Rahul Sharma)"
                        className="input-field flex-1"
                        autoFocus
                    />
                    <button
                        onClick={() => {
                            if (guestName.trim()) setSessionUser(createGuestUser(guestName.trim()));
                        }}
                        disabled={!guestName.trim()}
                        className="btn-primary"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        );
    }

    // ── NOT DEMO MODE & not signed in ──────────────────────────────────────
    if (!isDemo && !activeUser) {
        return (
            <div className="glass-card p-8 text-center space-y-4">
                <div className="text-4xl">🔒</div>
                <h3 className="text-lg font-bold text-white">Sign in to Report an Issue</h3>
                <p className="text-sm text-slate-400">Your identity is verified via Firebase Auth.</p>
            </div>
        );
    }

    // ── Form (user is identified) ───────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            {/* Header with user badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📝 Report an Environmental Issue</h3>
                <div className="flex items-center gap-2">
                    {activeUser?.photoURL && (
                        <img src={activeUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <span className="text-xs text-green-400 font-medium">
                        {activeUser?.displayName || activeUser?.email}
                    </span>
                    {isDemo && (
                        <button
                            type="button"
                            onClick={() => setSessionUser(null)}
                            className="text-xs text-slate-600 hover:text-slate-400 ml-1"
                        >
                            change
                        </button>
                    )}
                </div>
            </div>

            {/* Locality */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Locality *</label>
                <input
                    value={form.locality}
                    onChange={(e) => set('locality', e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Delhi"
                    required
                    className="input-field"
                />
            </div>

            {/* Category */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Category *</label>
                <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            type="button"
                            key={cat.value}
                            onClick={() => set('category', cat.value)}
                            className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl text-xs border transition-all
                ${form.category === cat.value
                                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                        >
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-center leading-tight hidden sm:block">{cat.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue Title *</label>
                <input
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Illegal dumping near Mutha river"
                    required
                    className="input-field"
                />
            </div>

            {/* Description */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Description * (min. 20 chars)</label>
                <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe the issue — location, severity, what you observed..."
                    required
                    rows={4}
                    className="input-field resize-none"
                />
            </div>

            {/* Media Upload */}
            <div>
                <label className="text-xs text-slate-400 mb-1 block">Photos & Videos (Optional)</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                >
                    <div className="text-2xl mb-1">📸</div>
                    <p className="text-xs text-slate-400">Click to add photos or videos</p>
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => {
                            if (e.target.files) {
                                setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                            }
                        }}
                    />
                </div>

                {/* Media Previews */}
                {files.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10 group">
                                {file.type.startsWith('video/') ? (
                                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, i) => i !== idx)); }}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2 mt-4 border-t border-white/10 pt-4">
                <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-green-500 cursor-pointer"
                />
                <label htmlFor="anonymous" className="text-sm text-slate-300 cursor-pointer flex-1">
                    Post anonymously (Hide my identity)
                </label>
            </div>

            {/* Result */}
            {result && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium border
          ${result.status === 'valid' ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : result.status === 'needs_review' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : result.status === 'invalid' ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : result.status === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                >
                    {result.message}
                </div>
            )}

            <button type="submit" disabled={submitting} className="w-full btn-primary justify-center py-3">
                {submitting ? '⚙️ AI Verifying...' : '🚀 Submit Report'}
            </button>
            <p className="text-xs text-slate-600 text-center">
                Posting as <strong className="text-slate-400">{activeUser?.displayName || activeUser?.email}</strong>
                {isDemo && <span className="text-slate-700"> · Demo mode</span>}
                {' · '}Posts are AI-verified before appearing publicly.
            </p>
        </form>
    );
}
