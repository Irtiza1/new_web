require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    await supabase.from('site_content').update({ content: 'LIVE DIRECT ANNOUNCEMENT DB SQA TEST 2026' }).eq('slug', 'announcement_bar');
    console.log("Updated DB");
}
check();
