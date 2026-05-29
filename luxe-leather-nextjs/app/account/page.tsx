'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { authClient, clearAuthCookie, syncAuthCookieFromSession } from '@/lib/auth/client';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

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
        <div className="min-h-screen bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#19130d] dark:text-white flex flex-col">
            <Header />
            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
                <div className="mb-10">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c27a2a]">Customer account</p>
                    <h1 className="text-4xl font-black tracking-tight mt-3">Account</h1>
                </div>

                {loading ? (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-slate-500">Loading account...</div>
                ) : !user ? (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
                        <h2 className="text-2xl font-black">Sign in required</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Log in to view account details and order history.</p>
                        <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-lg bg-[#1f1711] dark:bg-white px-5 text-sm font-black uppercase tracking-widest text-white dark:text-[#1f1711]">
                            Login
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-black">Profile</h2>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        Keep your name and contact preferences current for orders and bespoke requests.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 text-sm">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email</p>
                                    <p className="mt-1 font-bold break-all">{user.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveProfile} className="mt-8 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <label className="block">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Full name</span>
                                        <input
                                            value={form.full_name}
                                            onChange={(event) => handleChange('full_name', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#c27a2a]"
                                            placeholder="Your full name"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Display name</span>
                                        <input
                                            value={form.display_name}
                                            onChange={(event) => handleChange('display_name', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#c27a2a]"
                                            placeholder={profile?.display_name || 'Luxe customer'}
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</span>
                                    <input
                                        value={form.phone}
                                        onChange={(event) => handleChange('phone', event.target.value)}
                                        className="mt-2 h-12 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 font-bold outline-none focus:border-[#c27a2a]"
                                        placeholder="+92 300 0000000"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</span>
                                    <textarea
                                        value={form.bio}
                                        onChange={(event) => handleChange('bio', event.target.value)}
                                        className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-3 font-medium outline-none focus:border-[#c27a2a]"
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
                                        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1f1711] dark:bg-white px-5 text-sm font-black uppercase tracking-widest text-white dark:text-[#1f1711] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? 'Saving...' : 'Save profile'}
                                    </button>
                                </div>
                            </form>
                        </section>
                        <aside className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 h-fit">
                            <h3 className="font-black">Quick actions</h3>
                            <div className="mt-5 space-y-3">
                                <Link href="/shop" className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 font-bold">
                                    Shop collection <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                                <Link href="/bespoke" className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/10 px-4 py-3 font-bold">
                                    Bespoke request <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                                <button onClick={handleLogout} className="w-full flex items-center justify-between rounded-lg border border-red-200 px-4 py-3 font-bold text-red-600">
                                    Sign out <span className="material-symbols-outlined text-sm">logout</span>
                                </button>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
