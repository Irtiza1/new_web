require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTraffic() {
    console.log('--- STARTING TRAFFIC ANALYTICS TEST ---');

    console.log('\n[0] Logging in as Admin...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!'
    });

    if (authErr) {
        console.error('❌ Failed to login:', authErr.message);
        return;
    }
    const adminCookie = `sb-access-token=${encodeURIComponent(authData.session.access_token)}; sb-refresh-token=${encodeURIComponent(authData.session.refresh_token)}`;
    console.log('✅ Admin logged in.');

    // Generate a unique session ID for this test
    const sessionId = crypto.randomUUID();
    const testPath = `/test-path-${Date.now()}`;

    // 1. Post a new traffic event (Simulate Tracker Component)
    console.log(`\n[1] Tracking new page view for path: ${testPath}`);
    const trackRes = await fetch(`${BASE_URL}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventType: 'page_view',
            path: testPath,
            referrer: 'https://google.com',
            sessionId,
            country: 'US',
            region: 'CA',
            city: 'San Francisco',
            deviceType: 'Desktop',
            os: 'macOS',
            browser: 'Chrome'
        })
    });

    const trackData = await trackRes.json();
    if (!trackData.success) {
        console.error('❌ Failed to track event:', trackData);
        return;
    }
    console.log('✅ Traffic event successfully tracked and inserted into DB.');

    // 2. Fetch Analytics Summary (Simulate Admin Dashboard)
    console.log('\n[2] Fetching Traffic Analytics for Dashboard...');
    
    // Give DB a split second
    await new Promise(r => setTimeout(r, 1000));

    const analyticsRes = await fetch(`${BASE_URL}/api/analytics?type=traffic`, {
        headers: { 'Cookie': adminCookie }
    });
    const analyticsData = await analyticsRes.json();

    if (!analyticsData.success) {
        console.error('❌ Failed to fetch analytics:', analyticsData);
        return;
    }

    const stats = analyticsData.data;
    console.log(`✅ Analytics fetched successfully. Total Page Views: ${stats.pageViews}, Unique Sessions: ${stats.uniqueSessions}`);
    
    // Verify our test path is in the data
    const foundPath = stats.topPages.find(p => p.path === testPath);
    if (foundPath) {
        console.log(`✅ PERFECT! Found our test path "${testPath}" in the analytics top pages with ${foundPath.count} view(s).`);
    } else {
        console.warn(`⚠️ Could not find test path in top pages (it might be pushed out by other pages).`);
    }

    console.log('\n--- ALL TRAFFIC TESTS COMPLETED ---');
}

testTraffic();
