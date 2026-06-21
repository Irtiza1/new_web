import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const images = [
    { key: 'shipping_hero_image', file: '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/shipping_hero_image_1782046087389.png' },
    { key: 'login_hero_image', file: '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/login_hero_image_1782046110081.png' },
    { key: 'signup_hero_image', file: '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/signup_hero_image_1782046134670.png' }
];

async function main() {
    for (const img of images) {
        console.log(`Uploading ${img.key}...`);
        const buffer = fs.readFileSync(img.file);
        const filename = `${img.key}_new.png`;
        const filePath = `platform-images/${filename}`;
        
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, buffer, {
            contentType: 'image/png',
            upsert: true
        });
        
        if (uploadError) {
            console.error(`Failed to upload ${img.key}:`, uploadError);
            continue;
        }
        
        const url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
        
        // Update DB
        console.log(`Updating DB for ${img.key} to ${url}...`);
        
        // Check if exists
        const { data: existing } = await supabase.from('site_settings').select('*').eq('key', img.key).single();
        if (existing) {
            await supabase.from('site_settings').update({ value: url }).eq('key', img.key);
        } else {
            await supabase.from('site_settings').insert({ key: img.key, value: url });
        }
        console.log(`Success: ${img.key}`);
    }
}
main();
