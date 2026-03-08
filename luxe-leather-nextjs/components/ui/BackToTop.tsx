"use client";

import { useState, useEffect } from "react";

export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 left-8 z-40 p-3 rounded-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-500 transform ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-0 pointer-events-none"
                } group active:scale-90`}
            aria-label="Back to top"
        >
            <span className="material-symbols-outlined text-[24px] text-[#1A1A1A] dark:text-white group-hover:-translate-y-1 transition-transform">
                expand_less
            </span>

            {/* Tooltip */}
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-widest uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                Top
            </span>
        </button>
    );
}
