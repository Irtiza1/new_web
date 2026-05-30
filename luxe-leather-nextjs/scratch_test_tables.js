import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing shipping_zones...');
    const res1 = await supabase.from('shipping_zones').select('*');
    console.log('shipping_zones:', res1.error ? res1.error.message : 'SUCCESS', res1.data);

    console.log('Testing SizeGuide...');
    const res2 = await supabase.from('SizeGuide').select('*');
    console.log('SizeGuide:', res2.error ? res2.error.message : 'SUCCESS', res2.data);

    console.log('Testing site_content...');
    const res3 = await supabase.from('site_content').select('*');
    console.log('site_content:', res3.error ? res3.error.message : 'SUCCESS', res3.data);
}

test();
