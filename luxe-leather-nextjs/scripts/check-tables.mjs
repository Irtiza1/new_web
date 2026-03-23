import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const tables = ['media_files', 'shipping_rates', 'SizeGuide', 'custom_requests', 'cart_items', 'shipping_zones', 'orders', 'order_items'];
    
    console.log('--- Table Row Counts ---');
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error(`${table}: Error - ${error.message}`);
        } else {
            console.log(`${table}: ${count} rows`);
        }
    }
}

check().catch(console.error);
