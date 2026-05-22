require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testContact() {
  const contactId = "3023e32b-9721-4f11-9a70-75d19ec6ebf4"; // Random ID, just to see the error, but we need a real ID
  const body = { status: "read" };
  const { data, error } = await supabase.from('contact_messages').update(body).eq('id', contactId).select().single();
  console.log('Contact Error:', error);
  console.log('Contact Data:', data);
}

testContact();
