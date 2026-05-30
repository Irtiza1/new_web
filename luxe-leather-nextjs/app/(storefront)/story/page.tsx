'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { STATIC_ASSET_DEFAULTS, staticAsset } from '@/lib/staticAssets';

export default function OurStoryPage() {
    const [assets, setAssets] = useState<Record<string, string>>(STATIC_ASSET_DEFAULTS);

    useEffect(() => {
        fetch('/api/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setAssets((current) => ({ ...current, ...data.data }));
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-[#1b0e10] dark:text-white transition-colors duration-200 font-[family-name:var(--font-manrope)]">


            <main className="flex-grow">
                {/* Hero Narrative Section */}
                <section className="px-6 md:px-20 py-16 md:py-24 flex flex-col items-center text-center">
                    <div className="max-w-[720px] mx-auto flex flex-col gap-6">
                        <span className="text-[#cf1736] text-sm font-bold tracking-widest uppercase">Our Artisan Story</span>
                        <h1 className="text-5xl md:text-6xl font-medium leading-tight">
                            Crafted for a Lifetime.
                        </h1>
                        <div className="w-16 h-1 bg-[#cf1736] mx-auto my-2"></div>
                        <p className="text-[#1b0e10]/80 dark:text-gray-300 text-lg md:text-xl font-normal leading-relaxed">
                            Founded on the principles of slow fashion and enduring quality, {assets.site_title?.toUpperCase() || 'LUXE LEATHER CO.'} began as a small workshop in 2000. We believe that true luxury lies in the details—the hand-stitched seams, the carefully selected full-grain hides, and the patina that develops over years of use.
                        </p>
                        <p className="text-[#1b0e10]/60 dark:text-gray-400 text-base md:text-lg font-normal leading-relaxed">
                            Every piece tells a story of patience, skill, and an unwavering commitment to excellence. We don&apos;t just make leather goods; we create heirlooms meant to be passed down.
                        </p>
                    </div>
                </section>

                {/* Imagery Blocks */}
                <section className="px-6 md:px-20 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
                        <div className="flex flex-col gap-3 group">
                            <div className="w-full bg-center bg-no-repeat bg-cover rounded aspect-[4/5] md:aspect-[3/4] shadow-md transition-transform duration-500 hover:scale-[1.01]" style={{ backgroundImage: `url("${staticAsset(assets, 'story_sourcing_image')}")` }}></div>
                            <p className="text-sm font-medium text-[#1b0e10]/60 dark:text-gray-400 italic">Premium full-grain sourcing</p>
                        </div>
                        <div className="flex flex-col gap-3 md:mt-12 group">
                            <div className="w-full bg-center bg-no-repeat bg-cover rounded aspect-[4/5] md:aspect-[3/4] shadow-md transition-transform duration-500 hover:scale-[1.01]" style={{ backgroundImage: `url("${staticAsset(assets, 'story_stitching_image')}")` }}></div>
                            <p className="text-sm font-medium text-[#1b0e10]/60 dark:text-gray-400 italic">Hand-stitched details</p>
                        </div>
                    </div>
                </section>

                {/* Statistics Ribbon */}
                <section className="bg-[#f0efe8] dark:bg-[#2a1c1e] py-20 px-6 my-16">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-700/50">
                            {[
                                { value: '26+', label: 'Years of Experience', sub: 'Refining our craft daily' },
                                { value: '5k+', label: 'Unique Products', sub: 'Created for clients globally' },
                                { value: '40+', label: 'Countries Served', sub: 'Shipping worldwide' },
                                { value: '100%', label: 'Handcrafted Quality', sub: 'No shortcuts taken' },
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col gap-2 items-center justify-center p-4">
                                    <p className="text-[#cf1736] text-5xl md:text-6xl font-bold leading-tight">{stat.value}</p>
                                    <p className="dark:text-gray-200 text-sm font-bold uppercase tracking-widest mt-2">{stat.label}</p>
                                    <p className="text-[#1b0e10]/60 dark:text-gray-400 text-sm">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Quote Section */}
                <section className="px-6 md:px-20 py-16 flex justify-center">
                    <div className="max-w-[800px] text-center relative">
                        <span className="material-symbols-outlined text-6xl text-[#cf1736]/20 absolute -top-8 -left-8 select-none">format_quote</span>
                        <blockquote className="text-2xl md:text-3xl italic dark:text-gray-200 leading-normal">
                            &ldquo;We don&apos;t chase trends. We chase perfection. The leather we choose today will look even better over years, carrying the marks of your journey.&rdquo;
                        </blockquote>
                    </div>
                </section>

                {/* CTA Banner */}
                <div className="rounded-xl overflow-hidden relative max-w-[1200px] mx-auto h-[400px] grid place-items-center">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${staticAsset(assets, 'story_cta_image')}")` }}></div>
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10 text-center text-white p-6 w-full max-w-3xl">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">Find your piece?</h2>
                        <p className="text-xl opacity-95 mb-8 font-medium drop-shadow-md">Explore our latest collection of handcrafted leather goods.</p>
                        <Link href="/shop">
                            <button className="bg-[#cf1736] hover:bg-[#a3122a] text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-widest transition-colors shadow-lg">
                                Explore the Collection
                            </button>
                        </Link>
                    </div>
                </div>
            </main>


        </div>
    );
}
