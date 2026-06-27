require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkOrder() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', 'LLG-202606-7ABCEC');

  console.log('Result:', data);
  if (error) console.error('Error:', error);
}

checkOrder();
