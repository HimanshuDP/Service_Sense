'use client';

import { useState, useEffect } from 'react';
import { useAuth, AppUser } from '@/lib/AuthContext';
import { authApi } from '@/lib/api';

interface EditProfileModalProps {
    onClose: () => void;
    onUpdate: (user: AppUser) => void;
}

export default function EditProfileModal({ onClose, onUpdate }: EditProfileModalProps) {
    const { user, isDemo, logout } = useAuth();

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        userName: user?.userName || '',
        bio: user?.bio || '',
        photoURL: user?.photoURL || ''
    });

    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null);
    const [checkingUserName, setCheckingUserName] = useState(false);

    useEffect(() => {
        if (!formData.userName || formData.userName === user?.userName) {
            setUserNameAvailable(null);
            return;
        }
        setCheckingUserName(true);
        const timer = setTimeout(async () => {
            try {
                const res = await authApi.checkUsername(formData.userName);
                setUserNameAvailable(res.available);
            } catch (err) {
                setUserNameAvailable(null);
            } finally {
                setCheckingUserName(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.userName, user?.userName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.name === 'userName' ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') : e.target.value;
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (userNameAvailable === false) {
            setError('Please choose an available username first.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            let updatedUser: any;
            if (isDemo && user) {
                // Intercept for Demo mode (guest user) without JWT
                updatedUser = { ...user, ...formData };
                sessionStorage.setItem('demo_user', JSON.stringify(updatedUser));
            } else {
                updatedUser = await authApi.updateProfile({
                    displayName: formData.displayName,
                    userName: formData.userName,
                    bio: formData.bio,
                    photoURL: formData.photoURL
                });
            }
            onUpdate(updatedUser);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;

        setDeleting(true);
        setError('');

        try {
            if (!isDemo) {
                await authApi.deleteAccount();
            }
            await logout(); // Closes modal implicitly because user becomes null
            window.location.href = '/'; // Redirect to home page
        } catch (err: any) {
            setError(err.message || 'Failed to delete account');
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
                    Edit Profile
                </h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-slate-400">Username</label>
                            {formData.userName && formData.userName !== user?.userName && (
                                <span className={`text-[10px] font-medium ${checkingUserName ? 'text-slate-500' : userNameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                    {checkingUserName ? 'Checking...' : userNameAvailable ? '✓ Available' : '✕ Taken'}
                                </span>
                            )}
                        </div>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-colors ${formData.userName !== user?.userName && !checkingUserName && userNameAvailable === false ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-blue-500'}`}
                            placeholder="username123"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[80px]"
                            placeholder="Tell us about your environmental goals..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Profile Image URL</label>
                        <input
                            type="url"
                            name="photoURL"
                            value={formData.photoURL}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || deleting}
                        className="btn-primary w-full justify-center mt-2 disabled:opacity-50 !bg-gradient-to-r !from-blue-600 !to-purple-600"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                        onClick={handleDelete}
                        disabled={loading || deleting}
                        className="w-full text-red-400 hover:text-red-300 text-xs font-semibold py-2 transition-colors flex justify-center items-center"
                    >
                        {deleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}
