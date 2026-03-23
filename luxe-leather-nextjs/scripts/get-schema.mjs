import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchema() {
    const tables = ['media_files', 'shipping_rates', 'SizeGuide', 'custom_requests', 'cart_items', 'shipping_zones', 'orders', 'order_items'];
    
    for (const table of tables) {
        console.log(`\n--- Schema for ${table} ---`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
        
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            continue;
        }
        
        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, trying information_schema (if possible)...');
            // Supabase API doesn't easily expose information_schema via .from()
            // But we can try an empty insert/rollback or just check the keys from a successful select of an empty table if supported.
            // Actually, if data is empty, we can still get keys if the API returns them.
            // But usually it doesn't. 
            // I'll try to insert a dummy row and delete it? No, risky.
            // I'll just use the errors from Step 6266 which already told me some missing columns.
        }
    }
}

getSchema().catch(console.error);
