require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking duplicates...");
  
  // Check products
  const { data: prods } = await supabase.from('products').select('id, name, createdAt').order('createdAt', { ascending: false }).limit(5);
  console.log("Recent Products:", prods);

  // Check nav_items
  const { data: navs } = await supabase.from('nav_items').select('id, label, created_at').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Nav Items:", navs);
  
  // Check shipping_zones
  const { data: zones } = await supabase.from('shipping_zones').select('id, name, created_at').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Shipping Zones:", zones);
}

check();
