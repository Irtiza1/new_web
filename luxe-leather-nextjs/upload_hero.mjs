import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const filePath = path.join(process.cwd(), 'public', 'images', 'custom_orders_hero.png');
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'custom_orders_hero.png');
    formData.append('bucket', 'platform-images');
    
    console.log("Uploading to media library...");
    const res = await fetch('http://localhost:3000/api/media', {
        method: 'POST',
        body: formData
    });
    
    const result = await res.json();
    if (!result.success) {
        console.error("Upload failed:", result);
        return;
    }
    
    const newUrl = result.url;
    console.log("Upload successful! New URL:", newUrl);
    
    const { error } = await supabase.from('site_settings').update({ value: newUrl }).eq('key', 'bespoke_hero_image');
    if (error) {
        console.error("Failed to update site_settings:", error);
    } else {
        console.log("Successfully updated site_settings with new Media URL!");
    }
}

main();
