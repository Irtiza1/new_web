'use client';

import Link from 'next/link';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';

export default function OurStoryPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f8f6f6] dark:bg-[#211114] text-[#1b0e10] dark:text-white transition-colors duration-200" style={{ fontFamily: "'Newsreader', serif" }}>
            <Header />

            <main className="flex-grow">
                {/* Hero Narrative Section */}
                <section className="px-6 md:px-20 py-16 md:py-24 flex flex-col items-center text-center">
                    <div className="max-w-[720px] mx-auto flex flex-col gap-6">
                        <span className="text-[#cf1736] text-sm font-bold tracking-widest uppercase" style={{ fontFamily: "'Noto Sans', sans-serif" }}>Our Artisan Story</span>
                        <h1 className="text-5xl md:text-6xl font-medium leading-tight">
                            Crafted for a Lifetime.
                        </h1>
                        <div className="w-16 h-1 bg-[#cf1736] mx-auto my-2"></div>
                        <p className="text-[#1b0e10]/80 dark:text-gray-300 text-lg md:text-xl font-normal leading-relaxed">
                            Founded on the principles of slow fashion and enduring quality, LUXE LEATHER CO. began as a small workshop in 2013. We believe that true luxury lies in the details—the hand-stitched seams, the carefully selected full-grain hides, and the patina that develops over years of use.
                        </p>
                        <p className="text-[#1b0e10]/60 dark:text-gray-400 text-base md:text-lg font-normal leading-relaxed" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
                            Every piece tells a story of patience, skill, and an unwavering commitment to excellence. We don&apos;t just make leather goods; we create heirlooms meant to be passed down.
                        </p>
                        <div className="pt-6">
                            <button className="inline-flex items-center gap-2 px-8 py-3 rounded-sm border border-[#cf1736] text-[#cf1736] hover:bg-[#cf1736] hover:text-white transition-all duration-300 font-bold text-sm tracking-wide uppercase group">
                                Read Our History
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Imagery Blocks */}
                <section className="px-6 md:px-20 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
                        <div className="flex flex-col gap-3 group">
                            <div className="w-full bg-center bg-no-repeat bg-cover rounded aspect-[4/5] md:aspect-[3/4] shadow-md transition-transform duration-500 hover:scale-[1.01]" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuAjtiaK7tCTCU__1xs3wJGwKj_sMvqRg5QZYSoAKgVnyyZYQDJUGSucijpU1yyJALdEXJ7LFMZxc2qlRAIVeNwx93vd6hfH3ngg55FVqEOxqIRYDOgmWFmcDroHpKwbMWhvmi_la6X-edUHtAktxcPLP9RJictqlMGiNgbnhVC73l1Kt_SXE_4OOLfRt0BXZ1Jwuf05bGRKxqUd7zaiZ7Q-koaaH0UOdd6ektH4dnSQrs8cPllyn2adV5uqsg9jcKUlyD2I_HG-aoWO")` }}></div>
                            <p className="text-sm font-medium text-[#1b0e10]/60 dark:text-gray-400 italic">Premium full-grain sourcing</p>
                        </div>
                        <div className="flex flex-col gap-3 md:mt-12 group">
                            <div className="w-full bg-center bg-no-repeat bg-cover rounded aspect-[4/5] md:aspect-[3/4] shadow-md transition-transform duration-500 hover:scale-[1.01]" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBZ97uyqtye-GSN8F2Pz2jDdqjmslLzFGyDwwSjfkudpcoOLU1-PekxtHsWGH0i5anHveMKBT_l4_PbbRGBsQCzxEFNebh2IvS1aMJDKoh6O7nTstC2oGPNIwSOHg2cndlCT5WKyaGfVJiArEWlepP7ymRquuMNh64-bhDEyeOx3DuytNJwOGylxdCFyHMCWjzzZ6rvRgPSkzRXdsAWEZJgVypM2_1xaVXwC627bhfsExrf6Co2K8E1VbozKW86D-hp-SmwtMz5Qw5G")` }}></div>
                            <p className="text-sm font-medium text-[#1b0e10]/60 dark:text-gray-400 italic">Hand-stitched details</p>
                        </div>
                    </div>
                </section>

                {/* Statistics Ribbon */}
                <section className="bg-[#f0efe8] dark:bg-[#2a1c1e] py-20 px-6 my-16">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-700/50">
                            {[
                                { value: '10+', label: 'Years of Experience', sub: 'Refining our craft daily' },
                                { value: '5k+', label: 'Unique Products', sub: 'Created for clients globally' },
                                { value: '40+', label: 'Countries Served', sub: 'Shipping worldwide' },
                                { value: '100%', label: 'Handcrafted Quality', sub: 'No shortcuts taken' },
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col gap-2 items-center justify-center p-4">
                                    <p className="text-[#cf1736] text-5xl md:text-6xl font-bold leading-tight">{stat.value}</p>
                                    <p className="dark:text-gray-200 text-sm font-bold uppercase tracking-widest mt-2" style={{ fontFamily: "'Noto Sans', sans-serif" }}>{stat.label}</p>
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
                            &ldquo;We don&apos;t chase trends. We chase perfection. The leather we choose today will look even better in ten years, carrying the marks of your journey.&rdquo;
                        </blockquote>
                        <div className="mt-8 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-cover bg-center mb-4 border-2 border-[#cf1736]/20" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDMX4majIUk6fUlkseIJ8dgepBwt1zoDRR8OUtr63kTKy2q_oXahzNMXxmI539AsaC0PRuOlqq4_b4Dk4ekhBzR9E3Eu6HOspyESOTi_01GLyUK-JfL2hxQPtwehuc0HkD_UfcOrETWU4TF1HPb3bz-buzYGEwJ-iMx9uhFfSNw5tqEJn6MFIX2Szic6c91RJKNPoPl4bFf8h7VcObDIJh4sC0kzQYcVsXGph6r0Le84ob5uW9VyrCY-azd_nlBkYU1WkuCuvOHePPE")` }}></div>
                            <cite className="not-italic font-bold dark:text-white text-lg">Arthur Morgan</cite>
                            <span className="text-sm text-[#1b0e10]/60 dark:text-gray-400 uppercase tracking-widest text-xs mt-1" style={{ fontFamily: "'Noto Sans', sans-serif" }}>Founder &amp; Master Craftsman</span>
                        </div>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="px-6 pb-20 pt-10">
                    <div className="rounded-xl overflow-hidden relative max-w-[1200px] mx-auto h-[400px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGzSV6bS6T4fzxyUkVEXsY1l6Kbaukv26zjCOdbUURssex3g3-smR2f72179m_GDb5vtxMXKyWSFs9b1IcZnh5tkk7h7SiaCXYXS98BVtbJ0CR8b6jVTXRG-cRlIbTtPWvF6c-2MUwqpa4UrNr5v1EXAZlaFwLmn3bMMcXxRqgy1GALj0TSNl_-TyAoultuGKeVTim-VWlSjf_9QlzNVtox_qtzP382Q1Q9G21Fkf-TFCf1XTTsyQrCkH4hIIDqXRGttrYV8774Wg2")` }}></div>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 text-center text-white p-6 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4">Ready to find your piece?</h2>
                            <p className="text-lg opacity-90 mb-8 font-light">Explore our latest collection of handcrafted leather goods.</p>
                            <button className="bg-[#cf1736] hover:bg-[#a3122a] text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-widest transition-colors shadow-lg">
                                Explore the Collection
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
