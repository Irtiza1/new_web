-- Migration: Seed products table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Insert sample products for testing

INSERT INTO products (name, description, price, category, image, stock, sizes) VALUES
  ('Classic Leather Tote', 'Handcrafted tote bag with genuine leather', 149.99, 'Bags', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 15, ARRAY['One Size']),
  ('Slim Cardholder Wallet', 'Minimalist leather card holder', 34.99, 'Wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 50, NULL),
  ('Weekend Duffel Bag', 'Spacious travel bag with leather trim', 199.99, 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 8, ARRAY['Medium', 'Large']),
  ('Braided Leather Belt', 'Hand-braided leather belt', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500', 30, ARRAY['S', 'M', 'L', 'XL']),
  ('Executive Briefcase', 'Professional leather briefcase', 249.99, 'Bags', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 12, ARRAY['One Size']),
  ('Passport Holder', 'Travel-ready leather passport cover', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500', 40, NULL);
