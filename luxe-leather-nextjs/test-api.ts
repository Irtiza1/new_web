import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const id = '4a9993aa-fa07-4f87-b79a-15acab190a31';
    
    console.log("Updating product...");
    const { data, error } = await supabase
        .from('products')
        .update({
            sizes: ['XS', 'S', 'M'],
            shipping_info: {
                policy: "Test Policy",
                delivery_regular: "1 Day",
                delivery_custom: "2 Days"
            }
        })
        .eq('id', id)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating:", error);
    } else {
        console.log("Success! Updated product:", data);
    }
}

test();
