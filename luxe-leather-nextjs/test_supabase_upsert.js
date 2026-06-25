require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log("Testing insert...");
    const { data, error } = await supabase
        .from('site_content')
        .insert([{
            slug: 'test_upsert_slug',
            content: 'test content',
            title: 'test_upsert_slug',
            description: 'CMS Content',
            content_type: 'text'
        }]);
    
    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
    }
}

testUpsert();
