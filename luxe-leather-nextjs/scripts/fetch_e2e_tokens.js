#!/usr/bin/env node
/*
  Fetch E2E bearer tokens for admin and customer via Supabase REST auth
  and write them into Luxe_Leather_E2E_Postman_Environment.json.

  Requires env vars (or .env file):
    SUPABASE_URL, SUPABASE_ANON_KEY,
    ADMIN_EMAIL, ADMIN_PASSWORD,
    CUSTOMER_EMAIL, CUSTOMER_PASSWORD

  Run: `node scripts/fetch_e2e_tokens.js`
*/
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.');
  process.exit(1);
}

if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD) {
  console.error('Missing CUSTOMER_EMAIL or CUSTOMER_PASSWORD in environment.');
  process.exit(1);
}

async function fetchToken(email, password) {
  const url = SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/token?grant_type=password';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch token: ${res.status} ${txt}`);
  }

  const json = await res.json();
  // Support either direct token or session object
  return json.access_token || (json?.data?.access_token) || (json?.session?.access_token) || null;
}

async function main() {
  try {
    console.log('Fetching admin token...');
    const adminToken = await fetchToken(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Fetching customer token...');
    const customerToken = await fetchToken(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);

    if (!adminToken || !customerToken) {
      throw new Error('Failed to obtain tokens; check credentials and Supabase settings.');
    }

    const envPath = path.resolve(process.cwd(), 'Luxe_Leather_E2E_Postman_Environment.json');
    const envRaw = fs.readFileSync(envPath, 'utf8');
    const env = JSON.parse(envRaw);

    env.values = env.values.map(v => {
      if (v.key === 'admin_access_token') return { ...v, value: adminToken };
      if (v.key === 'customer_access_token') return { ...v, value: customerToken };
      return v;
    });

    fs.writeFileSync(envPath, JSON.stringify(env, null, 2));
    console.log('Updated Postman environment with tokens.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) main();
