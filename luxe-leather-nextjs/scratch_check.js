require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info');
  console.log('Error:', error);
  // fallback if rpc not there
  const res = await supabase.from('orders').select('*').limit(1);
  console.log('Orders columns:', Object.keys(res.data?.[0] || {}));
}

checkSchema();
