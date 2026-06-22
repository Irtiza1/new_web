require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

// Use standard PostgreSQL connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("FATAL ERROR: DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // If connecting to a remote DB, you might need ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('Starting 100% agnostic foundational database seeding using pure SQL...');
  const now = new Date().toISOString();

  try {
    // ==========================================
    // 1. ADMIN USER CREATION
    // ==========================================
    const adminId = '00000000-0000-0000-0000-000000000000';
    const adminEmail = 'admin@luxeleathergear.com';
    const adminPasswordHash = '$2b$10$xyzMockHashedPasswordStringxyz'; 
    
    await pool.query(`
      INSERT INTO users (id, email, encrypted_password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password
    `, [adminId, adminEmail, adminPasswordHash, now, now]);
    console.log('Admin user seeded in public.users.');

    await pool.query(`
      INSERT INTO user_profiles (user_id, full_name, display_name, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name
    `, [adminId, 'Admin User', 'Admin', now]);

    await pool.query(`
      INSERT INTO user_roles (user_id, role, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    `, [adminId, 'admin', now]);
    console.log(`Admin role & profile seeded for ${adminEmail}`);

    // ==========================================
    // 2. SITE CONTENT & SETTINGS
    // ==========================================
    const settings = [
      ['site_title', 'Luxe Leather Gear'],
      ['currency', 'USD'],
      ['support_email', 'support@luxeleathergear.com']
    ];
    for (const [key, value] of settings) {
      await pool.query(`
        INSERT INTO site_settings (id, key, value, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, [crypto.randomUUID(), key, value, now]);
    }

    const siteContent = [
      ['about-us', 'page', 'About Luxe Leather Gear', 'We are artisans of fine leather, dedicated to quality.'],
      ['privacy-policy', 'legal', 'Privacy Policy', 'Your data is secure with us.'],
      ['terms-of-service', 'legal', 'Terms of Service', 'By using our site, you agree to our terms.']
    ];
    for (const [slug, type, desc, content] of siteContent) {
      await pool.query(`
        INSERT INTO site_content (id, slug, content_type, description, content, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content
      `, [crypto.randomUUID(), slug, type, desc, content, now]);
    }
    console.log('Seeded base site settings and CMS pages.');

    // ==========================================
    // 3. SHIPPING & ZONES
    // ==========================================
    const zones = [
      ['Domestic US', 'United States', 10.00, 2],
      ['International', 'Europe, Asia, Australia', 50.00, 7]
    ];
    for (const [name, regions, rate, handling] of zones) {
      await pool.query(`
        INSERT INTO shipping_zones (id, name, regions, rate, handling_days, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, true, $6)
      `, [crypto.randomUUID(), name, regions, rate, handling, now]);
    }

    const rates = [
      ['dom_standard', 'Domestic', 10.00, 25.00, 200.00],
      ['intl_standard', 'International', 50.00, 100.00, 500.00]
    ];
    for (const [id, region, standard, express, free] of rates) {
      await pool.query(`
        INSERT INTO shipping_rates (id, region, standard, express, "freeAbove", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET standard = EXCLUDED.standard
      `, [id, region, standard, express, free, now, now]);
    }
    console.log('Seeded base shipping zones and rates.');

    // ==========================================
    // 4. NAV ITEMS
    // ==========================================
    const navs = [
      ['Shop All', '/shop', 1],
      ['Bespoke', '/bespoke', 2]
    ];
    for (const [label, url, order] of navs) {
      await pool.query(`
        INSERT INTO nav_items (id, label, url, display_order, is_visible, opens_in_new_tab, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, false, $5, $6)
      `, [crypto.randomUUID(), label, url, order, now, now]);
    }
    console.log('Seeded primary navigation links.');

    console.log('Agnostic foundational seeding complete! No transactional CRUD data was mocked.');

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await pool.end();
  }
}

seed();
