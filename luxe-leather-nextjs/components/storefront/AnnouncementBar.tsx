"use client";

import { useState, useEffect } from "react";
import { contentService } from "@/lib/services/contentService";

const DEFAULT_ANNOUNCEMENTS = [
    "Handcrafted Premium Leather | Free Worldwide Shipping",
    "Bespoke Orders Available | 12-15 Days Timeline",
    "Quality that Lasts a Lifetime | Lifetime Warranty"
];

export default function AnnouncementBar() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [announcementList, setAnnouncementList] = useState(DEFAULT_ANNOUNCEMENTS);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const [a1, a2, a3] = await Promise.all([
                    contentService.getBySlug('announcement_bar_text'),
                    contentService.getBySlug('announcement_bar_2'),
                    contentService.getBySlug('announcement_bar_3'),
                ]);
                const cms = [a1, a2, a3].filter(Boolean) as string[];
                if (cms.length > 0) setAnnouncementList(cms);
            } catch (_) {
                // fallback to defaults on error
            }
        }
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % announcementList.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [announcementList.length]);

    return (
        <div className="w-full bg-[#1A1A1A] text-white py-2 px-6 overflow-hidden relative border-b border-white/5">
            <div className="max-w-[1440px] mx-auto flex items-center justify-center min-h-[24px]">
                {announcementList.map((text, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 transform px-6 text-center ${index === currentIndex
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2 pointer-events-none"
                            }`}
                    >
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase">
                            {text}
                        </p>
                    </div>
                ))}
            </div>
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-[shimmer_8s_infinite]"></div>
        </div>
    );
}
