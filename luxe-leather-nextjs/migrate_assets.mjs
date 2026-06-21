import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    console.log("Starting migration...");
    const { data: mediaFiles, error } = await supabase.from('media_files').select('*').eq('folder', 'static-assets');
    if (error) { console.error("Error fetching media files:", error); return; }
    
    console.log(`Found ${mediaFiles.length} files in static-assets.`);
    
    for (const file of mediaFiles) {
        const oldPath = `static-assets/${file.filename}`;
        const newPath = `platform-images/${file.filename}`;
        
        console.log(`Processing: ${file.filename}`);
        
        // Attempt to move
        const { error: moveError } = await supabase.storage.from('media').move(oldPath, newPath);
        if (moveError && !moveError.message.includes("Object not found") && !moveError.message.includes("Duplicate")) {
            console.error(`  - Failed to move ${oldPath}:`, moveError);
            continue; 
        } else if (moveError) {
             console.log(`  - File might already be moved or missing: ${moveError.message}`);
        }
        
        const newUrl = supabase.storage.from('media').getPublicUrl(newPath).data.publicUrl;
        
        console.log(`  - Updating media_files URL to ${newUrl}...`);
        await supabase.from('media_files').update({ folder: 'platform-images', url: newUrl }).eq('id', file.id);
        
        // Check site settings
        const { data: settings } = await supabase.from('site_settings').select('*').eq('value', file.url);
        if (settings && settings.length > 0) {
            for (const setting of settings) {
                await supabase.from('site_settings').update({ value: newUrl }).eq('key', setting.key);
                console.log(`  - Updated site_setting key [${setting.key}] with new URL`);
            }
        }
        
        // Also check categories (if any used this static asset directly)
        const { data: cats } = await supabase.from('categories').select('*').eq('image_url', file.url);
        if (cats && cats.length > 0) {
            for (const cat of cats) {
                await supabase.from('categories').update({ image_url: newUrl }).eq('id', cat.id);
                console.log(`  - Updated category [${cat.name}] with new URL`);
            }
        }
    }
    console.log("Migration complete!");
}
main();
