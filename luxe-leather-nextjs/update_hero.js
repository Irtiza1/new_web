require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    const { data: existing } = await supabase.from('site_settings').select('*').eq('key', 'bespoke_hero_image').single();
    if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: '/images/custom_orders_hero.png' }).eq('key', 'bespoke_hero_image');
        console.log(error ? error : "Updated existing to /images/custom_orders_hero.png");
    } else {
        const { error } = await supabase.from('site_settings').insert([{ key: 'bespoke_hero_image', value: '/images/custom_orders_hero.png', type: 'image' }]);
        console.log(error ? error : "Inserted new /images/custom_orders_hero.png");
    }
}
main();
