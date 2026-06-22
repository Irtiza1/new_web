require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Starting foundational database seeding for AGNOSTIC database...');
  const now = new Date().toISOString();

  // ==========================================
  // 1. ADMIN USER CREATION (Independent public.users table)
  // ==========================================
  const adminId = '00000000-0000-0000-0000-000000000000'; // Mock UUID for admin
  const adminEmail = 'admin@luxeleathergear.com';
  // Normally you would bcrypt hash this in your backend
  const adminPasswordHash = '$2b$10$xyzMockHashedPasswordStringxyz'; 
  
  const { error: userErr } = await supabase.from('users').upsert({
    id: adminId,
    email: adminEmail,
    encrypted_password: adminPasswordHash,
    created_at: now,
    updated_at: now
  }, { onConflict: 'email' });
  
  if (userErr) {
    console.error('Admin User Error:', userErr.message);
  } else {
    console.log('Admin user seeded in public.users.');
    
    await supabase.from('user_profiles').upsert({
      user_id: adminId,
      full_name: 'Admin User',
      display_name: 'Admin',
      updated_at: now
    }, { onConflict: 'user_id' });

    await supabase.from('user_roles').upsert({
      user_id: adminId,
      role: 'admin',
      updated_at: now
    }, { onConflict: 'user_id' });
    console.log(`Admin role & profile seeded for ${adminEmail}`);
  }

  // ==========================================
  // 2. SITE CONTENT & SETTINGS (Foundational Config)
  // ==========================================
  const settings = [
    { id: crypto.randomUUID(), key: 'site_title', value: 'Luxe Leather Gear', updated_at: now },
    { id: crypto.randomUUID(), key: 'currency', value: 'USD', updated_at: now },
    { id: crypto.randomUUID(), key: 'support_email', value: 'support@luxeleathergear.com', updated_at: now }
  ];
  await supabase.from('site_settings').upsert(settings, { onConflict: 'key' });

  const siteContent = [
    { id: crypto.randomUUID(), slug: 'about-us', content_type: 'page', description: 'About Luxe Leather Gear', content: 'We are artisans of fine leather, dedicated to quality.', updated_at: now },
    { id: crypto.randomUUID(), slug: 'privacy-policy', content_type: 'legal', description: 'Privacy Policy', content: 'Your data is secure with us.', updated_at: now },
    { id: crypto.randomUUID(), slug: 'terms-of-service', content_type: 'legal', description: 'Terms of Service', content: 'By using our site, you agree to our terms.', updated_at: now }
  ];
  await supabase.from('site_content').upsert(siteContent, { onConflict: 'slug' });

  // ==========================================
  // 3. SHIPPING & ZONES (System Defaults)
  // ==========================================
  const zones = [
    { id: crypto.randomUUID(), name: 'Domestic US', regions: 'United States', rate: 10.00, handling_days: 2, is_active: true, created_at: now },
    { id: crypto.randomUUID(), name: 'International', regions: 'Europe, Asia, Australia', rate: 50.00, handling_days: 7, is_active: true, created_at: now }
  ];
  await supabase.from('shipping_zones').insert(zones);

  const rates = [
    { id: 'dom_standard', region: 'Domestic', standard: 10.00, express: 25.00, freeAbove: 200.00, createdAt: now, updatedAt: now },
    { id: 'intl_standard', region: 'International', standard: 50.00, express: 100.00, freeAbove: 500.00, createdAt: now, updatedAt: now }
  ];
  await supabase.from('shipping_rates').upsert(rates, { onConflict: 'id' });

  // ==========================================
  // 4. NAV ITEMS (System Layout)
  // ==========================================
  const navs = [
    { id: crypto.randomUUID(), label: 'Shop All', url: '/shop', display_order: 1, is_visible: true, opens_in_new_tab: false, created_at: now, updated_at: now },
    { id: crypto.randomUUID(), label: 'Bespoke', url: '/bespoke', display_order: 2, is_visible: true, opens_in_new_tab: false, created_at: now, updated_at: now }
  ];
  await supabase.from('nav_items').insert(navs);

  console.log('Agnostic foundational seeding complete!');
}

seed();
