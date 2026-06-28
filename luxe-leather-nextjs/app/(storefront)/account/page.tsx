'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { authClient, clearAuthCookie, getAuthHeader, syncAuthCookieFromSession } from '@/lib/auth/client';


type ProfileForm = {
    full_name: string;
    display_name: string;
    phone: string;
    bio: string;
};

type UserProfile = ProfileForm & {
    user_id: string;
    avatar_url?: string | null;
};

const emptyProfile: ProfileForm = {
    full_name: '',
    display_name: '',
    phone: '',
    bio: '',
};

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [form, setForm] = useState<ProfileForm>(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            await syncAuthCookieFromSession();
            const { data } = await authClient.auth.getUser();
            const authUser = data.user ?? null;
            setUser(authUser);

            if (authUser) {
                try {
                    const res = await fetch('/api/account/profile', {
                        headers: await getAuthHeader(),
                        credentials: 'include',
                    });
                    const json = await res.json();

                    if (!res.ok || !json.success) {
                        throw new Error(json.error || 'Unable to load profile');
                    }

                    const nextProfile = json.data as UserProfile;
                    setProfile(nextProfile);
                    setForm({
                        full_name: nextProfile.full_name ?? '',
                        display_name: nextProfile.display_name ?? '',
                        phone: nextProfile.phone ?? '',
                        bio: nextProfile.bio ?? '',
                    });
                } catch (profileError) {
                    setError(profileError instanceof Error ? profileError.message : 'Unable to load profile');
                }
            }

            setLoading(false);
        }
        load();
    }, []);

    const handleLogout = async () => {
        await authClient.auth.signOut();
        clearAuthCookie();
        router.replace('/');
        router.refresh();
    };

    const handleChange = (field: keyof ProfileForm, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
        setMessage(null);
        setError(null);
    };

    const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch('/api/account/profile', {
                method: 'PUT',
                headers: {
                    ...(await getAuthHeader()),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    full_name: form.full_name,
                    display_name: form.display_name,
                    phone: form.phone,
                    bio: form.bio,
                }),
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Unable to save profile');
            }

            const nextProfile = json.data as UserProfile;
            setProfile(nextProfile);
            setForm({
                full_name: nextProfile.full_name ?? '',
                display_name: nextProfile.display_name ?? '',
                phone: nextProfile.phone ?? '',
                bio: nextProfile.bio ?? '',
            });
            setMessage('Profile updated.');
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Unable to save profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#1b0e10] dark:text-white flex flex-col font-[family-name:var(--font-manrope)]">

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#cf1736]">Customer account</p>
                    <h1 className="text-4xl font-medium tracking-tight mt-3">Account</h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 animate-pulse">
                        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b0e10] p-8 space-y-6">
                            <div className="flex justify-between">
                                <div className="space-y-3 w-1/2">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                                </div>
                                <div className="w-32 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-5 pt-4">
                                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg col-span-2"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg col-span-2"></div>
                            </div>
                        </section>
                        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-[#f9fafb] dark:bg-white/5 p-8 flex flex-col items-center justify-center space-y-4">
                            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full mt-4"></div>
                        </section>
                    </div>
                ) : !user ? (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b0e10] p-8">
                        <h2 className="text-2xl font-medium">Sign in required</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Log in to view account details and order history.</p>
                        <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#cf1736] hover:bg-[#a3122a] px-5 text-sm font-bold uppercase tracking-widest text-white transition-colors">
                            Login
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b0e10] p-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-medium">Profile</h2>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        Keep your name and contact preferences current for orders and bespoke requests.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 text-sm">
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</p>
                                    <p className="mt-1 font-bold break-all">{user.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveProfile} className="mt-8 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <label className="block">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#1b0e10]/80 dark:text-slate-400">Full name</span>
                                        <input
                                            value={form.full_name}
                                            onChange={(event) => handleChange('full_name', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#cf1736]"
                                            placeholder="Your full name"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#1b0e10]/80 dark:text-slate-400">Display name</span>
                                        <input
                                            value={form.display_name}
                                            onChange={(event) => handleChange('display_name', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#cf1736]"
                                            placeholder={profile?.display_name || 'Luxe customer'}
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#1b0e10]/80 dark:text-slate-400">Phone</span>
                                    <input
                                        value={form.phone}
                                        onChange={(event) => handleChange('phone', event.target.value)}
                                        className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#cf1736]"
                                        placeholder="+92 300 0000000"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#1b0e10]/80 dark:text-slate-400">Notes</span>
                                    <textarea
                                        value={form.bio}
                                        onChange={(event) => handleChange('bio', event.target.value)}
                                        className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-3 font-medium outline-none focus:border-[#cf1736]"
                                        placeholder="Sizing notes, delivery preferences, or style details you want us to remember."
                                    />
                                </label>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-sm">
                                        {message && <p className="font-bold text-emerald-600">{message}</p>}
                                        {error && <p className="font-bold text-red-600">{error}</p>}
                                        {!message && !error && (
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Verification: <span className="font-bold">{user.email_confirmed_at ? 'Verified' : 'Pending verification'}</span>
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#cf1736] hover:bg-[#a3122a] px-5 text-sm font-bold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                                    >
                                        {saving ? 'Saving...' : 'Save profile'}
                                    </button>
                                </div>
                            </form>
                        </section>
                        <aside className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1b0e10] p-6 h-fit">
                            <h3 className="font-medium">Quick actions</h3>
                            <div className="mt-5 space-y-3">
                                <Link href="/shop" className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 font-bold hover:border-[#cf1736] dark:hover:border-white transition-colors">
                                    Shop collection <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                                <Link href="/custom-orders" className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 font-bold hover:border-[#cf1736] dark:hover:border-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">design_services</span>
                                        Custom Orders
                                    </div>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                                <button onClick={handleLogout} className="w-full flex items-center justify-between rounded-lg border border-red-200 px-4 py-3 font-bold text-red-600">
                                    Sign out <span className="material-symbols-outlined text-sm">logout</span>
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </main>

        </div>
    );
}
