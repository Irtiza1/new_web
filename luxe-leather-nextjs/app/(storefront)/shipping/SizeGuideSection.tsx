"use client";

import { useState } from 'react';
import type { SizeGuide } from '@/lib/services/sizeService';

interface SizeGuideSectionProps {
    sizeChart: SizeGuide[];
}

export default function SizeGuideSection({ sizeChart }: SizeGuideSectionProps) {
    const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

    const convert = (val: string): string => {
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return unit === 'cm' ? (num * 2.54).toFixed(1) : val;
    };

    return (
        <div className="bg-white dark:bg-white/5 p-8 md:p-12 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
            <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Jacket Size Chart</span>
                <div className="flex bg-gray-100 dark:bg-black/40 p-1 rounded-lg">
                    <button
                        onClick={() => setUnit('inches')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${unit === 'inches' ? 'bg-[#cf1736] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >Inches</button>
                    <button
                        onClick={() => setUnit('cm')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${unit === 'cm' ? 'bg-[#cf1736] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >CM</button>
                </div>
            </div>

            <div className="space-y-4">
                {sizeChart.map((size, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-lg border border-gray-100 dark:border-white/10 hover:border-[#cf1736] dark:hover:border-[#cf1736] transition-all bg-gray-50 dark:bg-black/20 group">
                        <div className="flex items-center gap-6">
                            <span className="w-12 h-12 bg-white dark:bg-black/40 rounded-lg flex items-center justify-center font-bold text-lg text-[#cf1736] shadow-sm">{size.label[0]}</span>
                            <div>
                                <p className="font-medium text-[#1b0e10] dark:text-white tracking-tight">{size.label}</p>
                                <p className="text-xs text-gray-400 uppercase font-bold">Regular Cut</p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-[#cf1736]">
                            <div className="text-center">
                                <p className="text-gray-400 mb-1">Chest ({unit})</p>
                                <p className="text-sm">{convert(size.chest)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 mb-1">Shoulder ({unit})</p>
                                <p className="text-sm">{convert(size.shoulders)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 p-6 bg-gray-50 dark:bg-black/20 rounded-lg border border-dashed border-gray-200 dark:border-white/20 text-center">
                <p className="text-sm font-medium text-[#1b0e10]/80 dark:text-gray-400 mb-4">Require a custom measurement not listed above?</p>
                <a href="/custom-orders" className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-[#1b0e10] border border-gray-200 px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all">
                    Custom Orders
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
            </div>
        </div>
    );
}
