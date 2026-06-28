const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000';
let adminCookie = '';

async function runTests() {
    console.log('--- STARTING SINGLE AUDIT TEST ---');

    // 0. Login as admin
    console.log('\n[0] Logging in as Admin...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!'
    });

    if (authErr) {
        console.error('❌ Failed to login:', authErr.message);
        return;
    }
    
    adminCookie = `sb-access-token=${encodeURIComponent(authData.session.access_token)}; sb-refresh-token=${encodeURIComponent(authData.session.refresh_token)}`;
    console.log('✅ Admin logged in.');

    // 1. Create a category via API (This should trigger auditLog)
    console.log('\n[1] Creating 1 dummy category via API...');
    const dummyCat = { name: 'Single Audit Test', slug: 'single-audit-test' };
    
    const res = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify(dummyCat)
    });
    
    const resData = await res.json();
    if (!resData.success) {
        console.error('❌ Failed to create category via API:', resData);
        return;
    }
    const catId = resData.data.id;
    console.log(`✅ Created category: ${catId}`);

    // 2. Verify Audit Log
    console.log('\n[2] Verifying single audit log in DB...');
    await new Promise(r => setTimeout(r, 1000)); // wait for insert
    
    const adminSupabase = createClient(supabaseUrl, supabaseKey);
    const { data: auditLogs, error: auditErr } = await adminSupabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', catId)
        .eq('action', 'CREATE');

    if (auditErr) {
        console.error('❌ Failed to fetch audit logs:', auditErr);
        return;
    }

    if (auditLogs && auditLogs.length === 1) {
        console.log('✅ PERFECT! Exactly 1 audit log found for the CREATE action.');
        
        // Clean up
        await fetch(`${BASE_URL}/api/categories?id=${catId}`, { method: 'DELETE', headers: { 'Cookie': adminCookie } });
    } else {
        console.error(`❌ Expected 1 audit log, found ${auditLogs ? auditLogs.length : 0}`);
    }

    console.log('\n--- ALL AUDIT TESTS COMPLETED ---');
}

runTests();
