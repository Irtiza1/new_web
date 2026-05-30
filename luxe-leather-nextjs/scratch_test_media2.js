import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    // 3. Get in-use URLs for Garbage Collection
    const inUseUrls = new Set();
    
    // Check products
    const { data: productsData } = await supabaseAdmin.from('products').select('image, images');
    if (productsData) {
        productsData.forEach(p => {
            if (p.image) inUseUrls.add(p.image);
            if (p.images && Array.isArray(p.images)) {
                p.images.forEach(img => {
                    if (img) inUseUrls.add(img);
                });
            }
        });
    }

    // Check categories
    const { data: categoriesData } = await supabaseAdmin.from('categories').select('image_url');
    if (categoriesData) {
        categoriesData.forEach(c => {
            if (c.image_url) inUseUrls.add(c.image_url);
        });
    }

    // Check all site settings that might contain image URLs
    const { data: settingsData } = await supabaseAdmin.from('site_settings').select('value');
    if (settingsData) {
        settingsData.forEach(s => {
            if (s.value && (s.value.includes('http://') || s.value.includes('https://') || s.value.includes('/media/'))) {
                inUseUrls.add(s.value);
            }
        });
    }

    const inUseString = Array.from(inUseUrls).join('|||');
    console.log("Found", inUseUrls.size, "unique in-use URLs.");

    // Let's get files from DB to test matching
    const { data: dbData } = await supabaseAdmin.from('media_files').select('*').limit(10);
    console.log("\nTesting match logic:");
    dbData?.forEach(f => {
        console.log(`- File: ${f.filename}`);
        console.log(`  is_used:`, inUseString.includes(f.filename) || inUseString.includes(f.url));
    });
}

test();
