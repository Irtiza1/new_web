const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanup() {
    // Revert CMS content
    await supabase.from('site_content').update({ content: 'Crafted for the World' }).eq('slug', 'home_hero_title');
    console.log("Reverted home_hero_title to 'Crafted for the World'");

    // Delete test nav links
    await supabase.from('nav_items').delete().eq('label', 'SQA Tested Link');
    await supabase.from('nav_items').delete().eq('label', 'SQA Test Link');
    console.log("Deleted SQA Tested Links from Navigation");
}
cleanup();
