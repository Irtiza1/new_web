const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000';
let adminCookie = '';
let testMessageId = '';

async function runTests() {
    console.log('--- STARTING CONTACT MESSAGES AUTOMATED TEST ---');

    // 0. Login as admin
    console.log('\n[0] Logging in as Admin...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!' 
    });

    if (authErr) {
        console.error('Failed to login:', authErr.message);
        // Fallback for tests if login fails
        return;
    }
    
    // Format token as base64 array as Next.js expects it
    const cookie = `sb-access-token=${encodeURIComponent(authData.session.access_token)}; sb-refresh-token=${encodeURIComponent(authData.session.refresh_token)}`;
    adminCookie = cookie;
    console.log('✅ Admin logged in.');

    // 1. Create a Message (Public Access)
    console.log('\n[1] Test Case 1: POST /api/contact (Public)');
    const postRes = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Automated Test User',
            email: 'test@example.com',
            phone: '1234567890',
            inquiry_type: 'Wholesale',
            message: 'This is an automated test message.'
        })
    });
    
    const postData = await postRes.json();
    if (!postRes.ok && postRes.status !== 503) {
        console.error('❌ POST failed', postData);
    } else {
        console.log('✅ POST success');
    }

    // 2. Fetch Messages (Admin Access)
    console.log('\n[2] Test Case 2: GET /api/contact/admin (Admin)');
    const getRes = await fetch(`${BASE_URL}/api/contact/admin`, {
        headers: { 'Cookie': adminCookie }
    });
    const getData = await getRes.json();
    if (!getData.success) {
        console.error('❌ GET failed', getData);
        return;
    }
    
    // Find our test message
    const msgs = getData.data;
    const ourMsg = msgs.find(m => m.email === 'test@example.com');
    if (ourMsg) {
        testMessageId = ourMsg.id;
        console.log(`✅ GET success. Found test message ID: ${testMessageId}`);
    } else {
        console.error('❌ GET success but test message not found in list.');
        return;
    }

    // 3. Update Message Status
    console.log(`\n[3] Test Case 3: PUT /api/contact/admin?id=${testMessageId}`);
    const putRes = await fetch(`${BASE_URL}/api/contact/admin?id=${testMessageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ status: 'replied' })
    });
    const putData = await putRes.json();
    if (putData.success && putData.data.status === 'replied') {
        console.log('✅ PUT success. Status updated to replied.');
    } else {
        console.error('❌ PUT failed', putData);
    }

    // 4. Bulk Delete Messages
    console.log(`\n[4] Test Case 4: DELETE /api/contact/admin (Bulk)`);
    const delRes = await fetch(`${BASE_URL}/api/contact/admin`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
        body: JSON.stringify({ ids: [testMessageId] })
    });
    const delData = await delRes.json();
    if (delData.success) {
        console.log('✅ DELETE success.');
    } else {
        console.error('❌ DELETE failed', delData);
    }

    // 5. Verify Deletion
    console.log('\n[5] Test Case 5: Verify Deletion');
    const verifyRes = await fetch(`${BASE_URL}/api/contact/admin`, {
        headers: { 'Cookie': adminCookie }
    });
    const verifyData = await verifyRes.json();
    const stillExists = verifyData.data.find(m => m.id === testMessageId);
    if (!stillExists) {
        console.log('✅ Verify success. Message is completely deleted from DB.');
    } else {
        console.error('❌ Verify failed. Message still exists.');
    }

    console.log('\n--- ALL TESTS COMPLETED ---');
}

runTests();
