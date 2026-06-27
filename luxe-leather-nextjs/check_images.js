require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, image, images')
    .limit(1);

  console.log('Result:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

checkProducts();
