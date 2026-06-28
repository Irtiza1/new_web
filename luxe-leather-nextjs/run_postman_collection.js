const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runPostman() {
    console.log('Logging in to Supabase to get dynamic admin token...');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: 'irtiza.s2918@gmail.com',
        password: 'LuxeAdmin123!'
    });

    if (error) {
        console.error('Failed to login:', error.message);
        return;
    }

    const cookie = `sb-access-token=${encodeURIComponent(authData.session.access_token)}; sb-refresh-token=${encodeURIComponent(authData.session.refresh_token)}`;
    console.log('Got admin cookie. Starting Newman (Postman CLI)...\n');

    try {
        const command = `npx newman run postman_collection.json --env-var "base_url=http://localhost:3000" --env-var "admin_cookie=${cookie}"`;
        const output = execSync(command, { stdio: 'inherit' });
    } catch (err) {
        console.error('\nNewman tests failed!');
    }
}

runPostman();
