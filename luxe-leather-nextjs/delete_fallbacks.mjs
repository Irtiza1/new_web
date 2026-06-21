import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const keys = ['product_fallback_image', 'featured_product_fallback_image'];
    for (const key of keys) {
        const { data: setting } = await supabase.from('site_settings').select('*').eq('key', key).single();
        if (setting && setting.value) {
            console.log(`Found ${key} url: ${setting.value}`);
            // Find in media_files
            const { data: media } = await supabase.from('media_files').select('*').eq('url', setting.value);
            if (media && media.length > 0) {
                const path = `${media[0].folder}/${media[0].filename}`;
                console.log(`Deleting ${path} from storage...`);
                await supabase.storage.from('media').remove([path]);
                await supabase.from('media_files').delete().eq('id', media[0].id);
            }
        }
        await supabase.from('site_settings').delete().eq('key', key);
    }
    console.log("Deleted fallback settings.");
}
main();
