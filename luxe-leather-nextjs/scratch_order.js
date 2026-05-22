require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testOrder() {
  const customerId = "f4adf480-8eb4-4396-b29a-cbc74a67136c"; // From newman output
  const productId = "63133a3b-007c-4820-baf5-bdb76451a0f4";
  
  const orderObj = {
    id: require('crypto').randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtotal: 199.99,
    shipping: 0,
    customer_id: customerId,
    total: 199.99,
    status: 'PENDING'
  };

  const { data, error } = await supabase.from('orders').insert([orderObj]).select().single();
  console.log('Order Error:', error);
  console.log('Order Data:', data);
}

testOrder();
