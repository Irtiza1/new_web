'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TrafficTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Helper: Parse OS, Browser, and Device from User Agent
    const parseUserAgent = (ua: string) => {
        let deviceType = 'Desktop';
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
            deviceType = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
        }

        let os = 'Unknown';
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
        else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/Linux/i.test(ua)) os = 'Linux';

        let browser = 'Unknown';
        if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';

        return { deviceType, os, browser };
    };

    // Helper: Fetch location securely and cache it in localStorage to avoid rate-limiting
    const fetchGeo = async () => {
        try {
            const cachedGeo = localStorage.getItem('visitor_geo');
            if (cachedGeo) return JSON.parse(cachedGeo);

            // ipapi.co is free for basic client-side rate-limits
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            
            const geo = {
                country: data.country_name || 'Unknown',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown'
            };
            
            localStorage.setItem('visitor_geo', JSON.stringify(geo));
            return geo;
        } catch {
            return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
        }
    };

    const sendEvent = useCallback(async (eventType: string, metadata?: Record<string, unknown>) => {
        try {
            let sessionId = sessionStorage.getItem('analytics_session_id');
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                sessionStorage.setItem('analytics_session_id', sessionId);
            }

            const geo = await fetchGeo();
            const { deviceType, os, browser } = parseUserAgent(navigator.userAgent);
            const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType,
                    path,
                    referrer: document.referrer || 'Direct',
                    sessionId,
                    country: geo.country,
                    region: geo.region,
                    city: geo.city,
                    deviceType,
                    os,
                    browser,
                    metadata: metadata || null
                }),
                keepalive: true
            });
        } catch {
            // Silently absorb failures so it never blocks storefront UX
        }
    }, [pathname, searchParams]);

    // Automatically track page view on navigation
    useEffect(() => {
        sendEvent('page_view');
        
        // Expose helper globally so other components can track events
        const extWindow = window as unknown as {
            trackEvent?: (eventType: string, metadata?: Record<string, unknown>) => void;
        };
        extWindow.trackEvent = (eventType: string, metadata?: Record<string, unknown>) => {
            sendEvent(eventType, metadata);
        };
    }, [pathname, searchParams, sendEvent]);

    return null;
}
