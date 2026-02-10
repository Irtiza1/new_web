-- Luxe Leather Co. Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  colors TEXT[], -- Array of available colors
  sizes TEXT[], -- Array of available sizes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL, -- Store order items as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom Requests Table
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, stock, colors, sizes) VALUES
('Classic Leather Tote', 'Handcrafted tote bag with genuine leather', 149.99, 'Bags', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 15, ARRAY['Brown', 'Black', 'Tan'], ARRAY['One Size']),
('Slim Cardholder Wallet', 'Minimalist leather card holder', 34.99, 'Wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 50, ARRAY['Black', 'Brown', 'Navy'], NULL),
('Weekend Duffel Bag', 'Spacious travel bag with leather trim', 199.99, 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 8, ARRAY['Brown', 'Black'], ARRAY['Medium', 'Large']),
('Braided Leather Belt', 'Hand-braided leather belt', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500', 30, ARRAY['Brown', 'Black', 'Tan'], ARRAY['S', 'M', 'L', 'XL']),
('Executive Briefcase', 'Professional leather briefcase', 249.99, 'Bags', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 12, ARRAY['Black', 'Brown'], ARRAY['One Size']),
('Passport Holder', 'Travel-ready leather passport cover', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500', 40, ARRAY['Brown', 'Black', 'Red'], NULL);

-- Insert sample customers
INSERT INTO customers (name, email, phone, city, country) VALUES
('Sophia Williams', 'sophia.w@example.com', '+1 (555) 123-4567', 'New York', 'USA'),
('Liam Brown', 'liam.b@example.com', '+44 20 1234 5678', 'London', 'UK'),
('Emma Davis', 'emma.d@example.com', '+61 2 1234 5678', 'Sydney', 'Australia');

-- Insert sample order
INSERT INTO orders (customer_id, status, total, items) VALUES
((SELECT id FROM customers WHERE email = 'sophia.w@example.com'), 'delivered', 184.98, 
'[{"product_id": "uuid-here", "quantity": 1, "price": 149.99, "color": "Brown"}, {"product_id": "uuid-here", "quantity": 1, "price": 34.99, "color": "Black"}]'::jsonb);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
