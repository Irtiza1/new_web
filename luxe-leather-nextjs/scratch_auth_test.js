const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log('Logging in...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!'
    });

    if (error) {
        console.error('Login failed:', error.message);
        return;
    }

    console.log('Logged in successfully. Access token:', data.session.access_token.slice(0, 20) + '...');

    console.log('Fetching POST /api/products from https://luxe-leather.vercel.app/api/products...');
    const res = await fetch('https://luxe-leather.vercel.app/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `sb-access-token=${encodeURIComponent(data.session.access_token)}`
        },
        body: JSON.stringify({
            name: "Test",
            price: 10,
            stock: 10,
            category: "Jackets"
        }),
        redirect: 'manual'
    });

    console.log('Response Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body length:', text.length);
}

testAuth();
