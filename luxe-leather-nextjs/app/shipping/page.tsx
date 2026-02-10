'use client';

import { useState } from 'react';
import Link from 'next/link';

const shippingRates = [
    { region: 'North America', time: '3-5 Business Days', cost: 'Free', highlight: true },
    { region: 'Europe', time: '5-7 Business Days', cost: '$15.00', highlight: false },
    { region: 'Asia Pacific', time: '7-10 Business Days', cost: '$25.00', highlight: false },
    { region: 'Rest of World', time: '10-14 Business Days', cost: '$35.00', highlight: false },
];

const sizeChart = [
    { label: 'S', chest: '36-38"', waist: '28-30"', shoulders: '17"' },
    { label: 'M', chest: '38-40"', waist: '31-33"', shoulders: '18"' },
    { label: 'L', chest: '40-42"', waist: '34-36"', shoulders: '19"' },
    { label: 'XL', chest: '42-44"', waist: '38-40"', shoulders: '20"' },
    { label: 'XXL', chest: '44-46"', waist: '40-42"', shoulders: '21"' },
];

export default function ShippingPage() {
    const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#FAFAF8] text-[#0d141b] font-[family-name:var(--font-inter)]">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 px-6 md:px-10 py-5 bg-white">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[24px]">checkroom</span>
                        <h2 className="text-lg font-bold tracking-tight">LUXE LEATHER CO.</h2>
                    </Link>
                </div>
                <div className="flex items-center gap-9">
                    <div className="hidden md:flex items-center gap-9">
                        <Link href="/shop" className="text-sm font-medium hover:text-[#1a73e8] transition-colors">Shop</Link>
                        <Link href="/our-story" className="text-sm font-medium hover:text-[#1a73e8] transition-colors">About</Link>
                        <Link href="#" className="text-sm font-medium hover:text-[#1a73e8] transition-colors">Support</Link>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </button>
                        <button className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex h-full grow flex-col min-h-[calc(100vh-80px)]">
                <div className="px-6 md:px-40 flex flex-1 justify-center py-10 md:py-16">
                    <div className="flex flex-col max-w-[960px] flex-1 w-full">
                        {/* Page Title */}
                        <div className="flex flex-col gap-6 text-center md:text-left mb-16">
                            <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em]">Shipping &amp; Fit Guide</h1>
                            <p className="text-[#4c739a] text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
                                Detailed information on our global shipping policies and sizing to ensure the perfect fit for your new piece.
                            </p>
                        </div>

                        {/* Shipping Rates */}
                        <section className="mb-20">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-[#1a73e8]">public</span>
                                <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em]">Global Shipping Rates</h2>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Region</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Delivery Time</th>
                                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {shippingRates.map(rate => (
                                            <tr key={rate.region} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-5 font-medium">{rate.region}</td>
                                                <td className="px-6 py-5 text-[#4c739a]">{rate.time}</td>
                                                <td className={`px-6 py-5 text-right ${rate.highlight ? 'font-bold text-[#1a73e8]' : 'font-medium'}`}>{rate.cost}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Size Guide */}
                        <section className="mb-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#1a73e8]">straighten</span>
                                    <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em]">Size Guide (Jackets)</h2>
                                </div>
                                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1 self-start md:self-auto">
                                    <button onClick={() => setUnit('inches')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${unit === 'inches' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-gray-500 hover:text-[#0d141b]'}`}>
                                        Inches
                                    </button>
                                    <button onClick={() => setUnit('cm')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${unit === 'cm' ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-gray-500 hover:text-[#0d141b]'}`}>
                                        CM
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-10 items-start">
                                {/* Size Table */}
                                <div className="w-full lg:w-2/3 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm order-2 lg:order-1">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Size Label</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Chest</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Waist</th>
                                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Shoulders</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sizeChart.map(size => (
                                                <tr key={size.label} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold">{size.label}</td>
                                                    <td className="px-6 py-4 text-[#4c739a]">{size.chest}</td>
                                                    <td className="px-6 py-4 text-[#4c739a]">{size.waist}</td>
                                                    <td className="px-6 py-4 text-[#4c739a]">{size.shoulders}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Visual Aid */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-6 order-1 lg:order-2">
                                    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <div className="absolute inset-0 bg-white opacity-60 z-0"></div>
                                        <div className="relative z-10 w-3/4 h-3/4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6">
                                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-2">checkroom</span>
                                            <p className="text-xs text-center text-gray-500 uppercase tracking-widest font-medium">Measurement<br />Guide</p>
                                            <div className="absolute top-[30%] w-full h-px bg-[#1a73e8]/40 flex items-center justify-center">
                                                <span className="bg-white px-1 text-[10px] text-[#1a73e8] font-bold">SHOULDERS</span>
                                            </div>
                                            <div className="absolute top-[45%] w-full h-px bg-[#1a73e8]/40 flex items-center justify-center">
                                                <span className="bg-white px-1 text-[10px] text-[#1a73e8] font-bold">CHEST</span>
                                            </div>
                                            <div className="absolute top-[70%] w-full h-px bg-[#1a73e8]/40 flex items-center justify-center">
                                                <span className="bg-white px-1 text-[10px] text-[#1a73e8] font-bold">WAIST</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[#1a73e8]/5 p-4 rounded-lg border border-[#1a73e8]/10">
                                        <div className="flex gap-2 items-start">
                                            <span className="material-symbols-outlined text-[#1a73e8] text-sm mt-0.5">info</span>
                                            <p className="text-xs text-[#4c739a] leading-relaxed">
                                                <strong>Pro Tip:</strong> Measure over a light shirt for the most accurate sizing. If you fall between sizes, we recommend sizing up for a more comfortable fit.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Help */}
                        <div className="border-t border-gray-200 mt-8 pt-10 pb-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-full">
                                        <span className="material-symbols-outlined text-gray-600">help</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Still unsure about your size?</h3>
                                        <p className="text-gray-500 text-sm">Our support team can help you find the perfect fit.</p>
                                    </div>
                                </div>
                                <Link href="/contact" className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a73e8] transition-colors">
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12 px-10">
                <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] mb-4">LUXE LEATHER CO.</h2>
                        <p className="text-sm text-gray-500 max-w-xs">Premium leather goods crafted for the modern individual. Quality, durability, and style in every stitch.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a className="hover:text-[#1a73e8]" href="#">New Arrivals</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Best Sellers</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Jackets</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Accessories</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-4">Customer Care</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><a className="hover:text-[#1a73e8] font-medium text-[#1a73e8]" href="#">Shipping &amp; Returns</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Size Guide</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Care Instructions</a></li>
                            <li><a className="hover:text-[#1a73e8]" href="#">Contact Us</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-[960px] mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                    <p>© 2023 Luxe Leather Co. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a className="hover:text-gray-600" href="#">Privacy Policy</a>
                        <a className="hover:text-gray-600" href="#">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
