-- Migration: Create products table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Products catalog with inventory management

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  images TEXT[],
  stock INTEGER DEFAULT 0,
  sizes TEXT[],
  badge TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  "salesCount" INTEGER DEFAULT 0,
  "customSizingPrice" NUMERIC(10, 2),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();
