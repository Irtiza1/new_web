require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  console.log("Finishing cleanup by respecting foreign keys...");
  const afterTime = '2026-06-21T16:00:00.000Z';

  // 1. Delete Reviews (references products)
  const { error: rErr } = await supabase.from('reviews').delete().gte('created_at', afterTime);
  if (rErr) console.error("Reviews error:", rErr);

  // 2. Delete Order Items (references orders and products)
  // We can't directly check created_at on order_items if it doesn't have it, but we can delete items for the specific order.
  // Wait, let's just delete by looking up the fake customer Alice Smith's order.
  const { data: custData } = await supabase.from('customers').select('id').eq('name', 'Alice Smith');
  if (custData && custData.length > 0) {
    for (const cust of custData) {
      const { data: ordData } = await supabase.from('orders').select('id').eq('customer_id', cust.id);
      if (ordData) {
        for (const ord of ordData) {
           await supabase.from('order_items').delete().eq('order_id', ord.id);
           await supabase.from('orders').delete().eq('id', ord.id);
        }
      }
      await supabase.from('customers').delete().eq('id', cust.id);
    }
    console.log("Cleaned Alice Smith, her orders, and order items.");
  }

  // 3. Delete Products
  const { error: pErr } = await supabase.from('products').delete().in('name', ['Classic Aviator Jacket', 'Vintage Messenger Bag']);
  if (pErr) console.error("Products error:", pErr);
  else console.log("Cleaned mock products.");

  console.log("Cleanup completely finished.");
}

cleanup();
