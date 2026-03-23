import React from 'react';

export interface FilterTab {
    label: string;
    value: string;
}

export interface AdminFilterTabsProps {
    tabs: FilterTab[];
    activeTab: string;
    onTabChange: (value: string) => void;
}

export default function AdminFilterTabs({ tabs, activeTab, onTabChange }: AdminFilterTabsProps) {
    return (
        <div className="flex overflow-x-auto w-full md:w-auto bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm custom-scrollbar pb-1">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab.value
                            ? 'bg-[#d41132] text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
