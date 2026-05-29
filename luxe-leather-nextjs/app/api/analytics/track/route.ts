import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            eventType = 'page_view',
            path,
            referrer,
            sessionId,
            country,
            region,
            city,
            deviceType,
            os,
            browser,
            metadata
        } = body;

        if (!path || !sessionId) {
            return NextResponse.json({ success: false, error: 'Path and Session ID are required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('traffic_events')
            .insert([{
                event_type: eventType,
                path,
                referrer: referrer || null,
                session_id: sessionId,
                country: country || null,
                region: region || null,
                city: city || null,
                device_type: deviceType || null,
                os: os || null,
                browser: browser || null,
                metadata: metadata || null,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            // If table doesn't exist yet, print helper message but return 200/silently skip so it doesn't crash user's console
            if (error.code === '42P01') {
                console.warn('[Analytics Tracker] traffic_events table does not exist. Run migration 021_create_traffic_events_table.sql in your Supabase SQL Editor.');
                return NextResponse.json({ success: true, message: 'Table setup required' });
            }
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('Analytics tracking failed:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
    }
}
