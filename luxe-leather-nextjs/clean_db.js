require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tables = [
  'audit_logs', 'order_items', 'orders', 'reviews', 'custom_requests',
  'shipping_zones', 'coupons', 'contact_messages', 'media_files',
  'products', 'categories', 'nav_items', 'customers', 'SizeGuide'
];

async function cleanAll() {
  console.log('Cleaning all tables...');
  for (const table of tables) {
    await supabase.from(table).delete().not('id', 'is', null);
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  console.log('Clean complete.');
}
cleanAll();
