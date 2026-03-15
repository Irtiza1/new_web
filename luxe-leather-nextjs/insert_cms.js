const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const newContent = [
    { slug: 'bespoke_hero_title', content: 'Bespoke Artistry', description: 'Bespoke page main heading', content_type: 'text' },
    { slug: 'bespoke_hero_subtitle', content: 'Beyond the collection lies a world of pure imagination. Collaborate with our master artisans to create a legacy piece uniquely yours.', description: 'Bespoke page subheading', content_type: 'text' },
    { slug: 'bespoke_cta_text', content: 'Initiate Commission', description: 'Bespoke page primary button text', content_type: 'text' },
    { slug: 'shipping_hero_title', content: 'Fitting & Shipping', description: 'Shipping page main heading', content_type: 'text' },
    { slug: 'shipping_hero_subtitle', content: 'Ensuring the perfect acquisition of your next legacy piece. From precise measurements to insured global delivery, every detail is managed with artisan care.', description: 'Shipping page subheading', content_type: 'text' }
];

async function insert() {
    for (const item of newContent) {
        const { error } = await supabase.from('site_content').upsert(item, { onConflict: 'slug' });
        if (error) console.error(item.slug, error.message);
        else console.log('Successfully inserted/upserted', item.slug);
    }
}
insert();
