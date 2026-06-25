require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
    const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .limit(1);
    
    console.log("Data columns:", data ? Object.keys(data[0] || {}) : "No data");
    console.log("Error:", error);
}

testSchema();
