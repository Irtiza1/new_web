import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const file = '/Users/muhammadirtiza/.gemini/antigravity-ide/brain/f30b9ef5-38b0-4a65-af01-97fb15314806/login_hero_image_1782046110081.png';
const filePath = 'platform-images/login_hero_image_new.png';

const fileBuffer = fs.readFileSync(file);

const options = {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'image/png',
        'Content-Length': Buffer.byteLength(fileBuffer)
    }
};

const parsedUrl = new URL(`${supabaseUrl}/storage/v1/object/media/${filePath}`);

console.log("Uploading via https...");
const req = https.request(parsedUrl, options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', async () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("Success! File uploaded.");
            const url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
            
            const { data: existing } = await supabase.from('site_settings').select('*').eq('key', 'login_hero_image').single();
            if (existing) {
                await supabase.from('site_settings').update({ value: url }).eq('key', 'login_hero_image');
            } else {
                await supabase.from('site_settings').insert({ key: 'login_hero_image', value: url });
            }
            console.log(`Updated db for login_hero_image to ${url}`);
        } else {
            console.error(`Error: ${responseData}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(fileBuffer);
req.end();
