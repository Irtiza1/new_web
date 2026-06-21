import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

// This route runs the pending migration using a service-role-like approach
// It splits the SQL into individual statements and runs them one by one
export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(url, key);

    const statements = [
        // Categories table
        `CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            image_url TEXT,
            display_order INTEGER DEFAULT 0,
            is_visible BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        // Seed categories
        `INSERT INTO categories (name, slug, display_order) VALUES
            ('Jackets', 'jackets', 1),
            ('Full Coats', 'full-coats', 2),
            ('Bags & Satchels', 'bags-satchels', 3),
            ('Accessories', 'accessories', 4),
            ('Shoes', 'shoes', 5)
        ON CONFLICT (slug) DO NOTHING`,
        // Reviews table
        `CREATE TABLE IF NOT EXISTS reviews (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255),
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            is_featured BOOLEAN DEFAULT false,
            helpful_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        // Seed reviews
        `INSERT INTO reviews (customer_name, rating, comment, status, is_featured) VALUES
            ('James Caldwell', 5, 'The craftsmanship is honestly unlike anything I seen before.', 'approved', true),
            ('Sarah Jenkins', 5, 'I ordered a custom jacket. Truly a luxury experience.', 'approved', true),
            ('Michael Ross', 4, 'Finally found a bag that looks professional.', 'approved', false),
            ('Aisha Khan', 5, 'Absolutely stunning quality. The stitching is perfect.', 'pending', false)`,
        // Nav items table
        `CREATE TABLE IF NOT EXISTS nav_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            label VARCHAR(100) NOT NULL,
            url VARCHAR(255) NOT NULL,
            display_order INTEGER DEFAULT 0,
            is_visible BOOLEAN DEFAULT true,
            opens_in_new_tab BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        // Seed nav items
        `INSERT INTO nav_items (label, url, display_order, is_visible) 
        SELECT * FROM (VALUES
            ('Shop', '/shop', 1, true),
            ('Custom Orders', '/custom-orders', 2, true),
            ('Shipping & Sizing', '/shipping', 3, true),
            ('Our Story', '/story', 4, true),
            ('Contact', '/contact', 5, true)
        ) AS t(label, url, display_order, is_visible)
        WHERE NOT EXISTS (SELECT 1 FROM nav_items LIMIT 1)`,
        // Coupons table (if not exists)
        `CREATE TABLE IF NOT EXISTS coupons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
            value NUMERIC(10,2) NOT NULL,
            min_order_amount NUMERIC(10,2),
            max_uses INTEGER,
            uses_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            expiry_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
    ];

    const results: { sql: string; status: string; error?: string }[] = [];

    for (const sql of statements) {
        const { error } = await client.rpc('exec_sql', { sql_query: sql }).maybeSingle();
        if (error) {
            // Try direct insert approach for tables that might already exist
            results.push({ sql: sql.substring(0, 60) + '...', status: 'skipped', error: error.message });
        } else {
            results.push({ sql: sql.substring(0, 60) + '...', status: 'ok' });
        }
    }

    return NextResponse.json({ results });
}
