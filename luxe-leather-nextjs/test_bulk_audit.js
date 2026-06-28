const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000';
let adminCookie = '';

async function runTests() {
    console.log('--- STARTING BULK AUDIT N+1 TEST ---');

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

    // 1. Seed Data: Create 3 dummy categories directly via DB
    console.log('\n[1] Creating 3 dummy categories...');
    const dummyCats = [
        { name: 'Bulk Test 1', slug: 'bulk-test-1' },
        { name: 'Bulk Test 2', slug: 'bulk-test-2' },
        { name: 'Bulk Test 3', slug: 'bulk-test-3' },
    ];
    
    const { data: insertedCats, error: insertErr } = await supabase.from('categories').insert(dummyCats).select();
    if (insertErr || !insertedCats) {
        console.error('❌ Failed to seed categories:', insertErr);
        return;
    }
    const catIds = insertedCats.map(c => c.id);
    console.log(`✅ Seeded 3 categories: ${catIds.join(', ')}`);

    // 2. Bulk Delete via API
    console.log('\n[2] Triggering bulk delete via API...');
    const delRes = await fetch(`${BASE_URL}/api/categories`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminCookie
        },
        body: JSON.stringify({ ids: catIds })
    });
    
    const delData = await delRes.json();
    if (!delData.success) {
        console.error('❌ Bulk delete failed:', delData);
        return;
    }
    console.log('✅ Bulk delete API returned success.');

    // 3. Verify Audit Logs
    console.log('\n[3] Verifying bulk audit logs in DB...');
    // Give Supabase a split second to finish the insert
    await new Promise(r => setTimeout(r, 1000));
    
    const { data: auditLogs, error: auditErr } = await supabase
        .from('audit_logs')
        .select('*')
        .in('record_id', catIds)
        .eq('action', 'DELETE');

    if (auditErr) {
        console.error('❌ Failed to fetch audit logs:', auditErr);
        return;
    }

    if (auditLogs && auditLogs.length === 3) {
        console.log('✅ PERFECT! Exactly 3 audit logs were found, created via our bulk insert array.');
    } else {
        console.error(`❌ Expected 3 audit logs, found ${auditLogs ? auditLogs.length : 0}`);
    }

    console.log('\n--- ALL N+1 AUDIT TESTS COMPLETED ---');
}

runTests();
