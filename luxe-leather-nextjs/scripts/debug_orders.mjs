import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOrders() {
    const { data, error } = await supabase
        .from('Order')
        .select('*, Customer(name, email), OrderItem(quantity)')
        .limit(5);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log('Sample Order Data Structure:');
    console.log(JSON.stringify(data?.[0], null, 2));

    if (data) {
        data.forEach((order, idx) => {
            console.log(`Order ${idx}: ID=${order.id}, items=${!!order.items}, OrderItem=${!!order.OrderItem}, OrderItems=${!!order.OrderItems}`);
            if (order.items) console.log(`   items length: ${Array.isArray(order.items) ? order.items.length : 'not an array'}`);
            if (order.OrderItem) console.log(`   OrderItem length: ${Array.isArray(order.OrderItem) ? order.OrderItem.length : 'not an array'}`);
        });
    }
}

checkOrders();
