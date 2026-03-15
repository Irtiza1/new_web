"use client";

import React from 'react';

export default function WhatsAppFAB() {
    return (
        <a 
            href="https://wa.me/YOUR_PHONE_NUMBER" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-40 flex items-center justify-center w-14 h-14 bg-[#10b981] text-white rounded-full shadow-2xl hover:bg-[#059669] hover:scale-110 transition-all duration-300 active:scale-95 group"
            aria-label="Contact us on WhatsApp"
        >
            <svg fill="currentColor" height="30px" viewBox="0 0 256 256" width="30px" className="drop-shadow-sm">
                <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"></path>
            </svg>
            
            {/* Tooltip */}
            <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-bold tracking-widest uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-xl">
                Chat with an Artisan
            </span>
        </a>
    );
}
