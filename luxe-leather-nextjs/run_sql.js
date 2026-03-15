const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Irtiza1%40supabase@db.pgcprmhaalolzjvqfwyo.supabase.co:5432/postgres?sslmode=require'
});

async function run() {
    await client.connect();
    const sql = `
  DO $$ 
BEGIN
    -- 1. Drop old/placeholder tables if they are empty
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products') THEN
        IF (SELECT count(*) FROM products) = 0 THEN
            DROP TABLE products CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders') THEN
        IF (SELECT count(*) FROM orders) = 0 THEN
            DROP TABLE orders CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items') THEN
        IF (SELECT count(*) FROM order_items) = 0 THEN
            DROP TABLE order_items CASCADE;
        END IF;
    END IF;
    
     IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers') THEN
        IF (SELECT count(*) FROM customers) = 0 THEN
            DROP TABLE customers CASCADE;
        END IF;
    END IF;
    
     IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'custom_requests') THEN
        IF (SELECT count(*) FROM custom_requests) = 0 THEN
            DROP TABLE custom_requests CASCADE;
        END IF;
    END IF;
    
     IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'shipping_rates') THEN
        IF (SELECT count(*) FROM shipping_rates) = 0 THEN
            DROP TABLE shipping_rates CASCADE;
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'site_settings' AND schemaname = 'public') THEN
        IF (SELECT count(*) FROM site_settings) = 0 THEN
            DROP TABLE site_settings CASCADE;
        END IF;
    END IF;
    
    -- 2. Rename the PascalCase ones if they still exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Product') THEN
       ALTER TABLE "Product" RENAME TO products;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Order') THEN
       ALTER TABLE "Order" RENAME TO orders;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'OrderItem') THEN
       ALTER TABLE "OrderItem" RENAME TO order_items;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Customer') THEN
       ALTER TABLE "Customer" RENAME TO customers;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'CustomRequest') THEN
       ALTER TABLE "CustomRequest" RENAME TO custom_requests;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ShippingRate') THEN
       ALTER TABLE "ShippingRate" RENAME TO shipping_rates;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'Setting') THEN
       ALTER TABLE "Setting" RENAME TO site_settings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'CMSContent') THEN
       ALTER TABLE "CMSContent" RENAME TO site_content;
    END IF;


END $$;

ALTER TABLE IF EXISTS order_items RENAME COLUMN IF EXISTS "productId" TO product_id;
ALTER TABLE IF EXISTS order_items RENAME COLUMN IF EXISTS "orderId" TO order_id;
ALTER TABLE IF EXISTS orders RENAME COLUMN IF EXISTS "customerId" TO customer_id;

ALTER TABLE IF EXISTS products ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE IF EXISTS orders ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE IF EXISTS order_items ALTER COLUMN product_id TYPE UUID USING product_id::uuid;
ALTER TABLE IF EXISTS order_items ALTER COLUMN order_id TYPE UUID USING order_id::uuid;

-- Ensure Site Settings exists
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Site Content exists and has the rows
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    content_type VARCHAR(20) DEFAULT 'text',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Shipping Rates exists
CREATE TABLE IF NOT EXISTS shipping_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    regions TEXT NOT NULL,
    handling_days INTEGER NOT NULL DEFAULT 7,
    rate FLOAT NOT NULL DEFAULT 0,
    free_above FLOAT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Force reload of PostgREST schema cache
NOTIFY pgrst, 'reload schema';
  `;
    try {
        await client.query(sql);
        console.log('Success - DB Cleanup Executed');
    } catch (e) {
        console.error('Error executing query:', e);
    } finally {
        await client.end();
    }
}

run();
