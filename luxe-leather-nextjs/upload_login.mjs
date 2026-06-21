import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const file = '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/login_hero_image_1782046110081.png';
    const filePath = 'platform-images/login_hero_image_new.png';

    const curlCmd = `curl -X POST "${supabaseUrl}/storage/v1/object/media/${filePath}" \\
    -H "Authorization: Bearer ${supabaseKey}" \\
    -H "Content-Type: image/png" \\
    --data-binary @"${file}"`;

    try {
        console.log("Uploading via curl...");
        execSync(curlCmd, { stdio: 'inherit' });
        console.log("\\nUploaded via curl.");
        const url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
        
        const { data: existing } = await supabase.from('site_settings').select('*').eq('key', 'login_hero_image').single();
        if (existing) {
            await supabase.from('site_settings').update({ value: url }).eq('key', 'login_hero_image');
        } else {
            await supabase.from('site_settings').insert({ key: 'login_hero_image', value: url });
        }
        console.log(`Updated db for login_hero_image to ${url}`);
    } catch(e) {
        console.error("Upload failed", e);
    }
}
main();
