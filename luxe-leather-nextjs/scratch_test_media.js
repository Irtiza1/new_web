import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: productsData } = await supabaseAdmin.from('products').select('image'); 
    console.log("Products images:", productsData?.map(p => p.image));

    const { data: settingsData } = await supabaseAdmin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle();
    console.log("Settings logo:", settingsData?.value);

    // Try a direct call to the API logic to see how inUseString matching works
    const inUseUrls = new Set();
    if (productsData) productsData.forEach(p => { if (p.image) inUseUrls.add(p.image); });
    if (settingsData && settingsData.value) inUseUrls.add(settingsData.value);

    const inUseString = Array.from(inUseUrls).join('|||');
    console.log("inUseString:", inUseString);

    // Let's get files from DB to test matching
    const { data: dbData } = await supabaseAdmin.from('media_files').select('*').limit(5);
    console.log("\nTesting match logic:");
    dbData?.forEach(f => {
        console.log(`- File: ${f.filename}`);
        console.log(`  URL: ${f.url}`);
        console.log(`  is_used via filename:`, inUseString.includes(f.filename));
        console.log(`  is_used via URL:`, inUseString.includes(f.url));
    });
}

test();
