const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const newContent = [
    { slug: 'announcement_bar_2', content: 'Bespoke Orders Available | 12-15 Days Timeline', description: 'Announcement bar content 2', content_type: 'text' },
    { slug: 'announcement_bar_3', content: 'Quality that Lasts a Lifetime | Lifetime Warranty', description: 'Announcement bar content 3', content_type: 'text' },
];

async function insert() {
    for (const item of newContent) {
        const { error } = await supabase.from('site_content').upsert(item, { onConflict: 'slug' });
        if (error) console.error(item.slug, error.message);
        else console.log('Successfully inserted/upserted', item.slug);
    }
}
insert();
