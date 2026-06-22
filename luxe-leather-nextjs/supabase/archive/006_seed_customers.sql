-- Migration: Seed customers table
-- Created: 2026-02-10
-- Description: Insert sample customers for testing

INSERT INTO customers (name, email, phone, city, country) VALUES
  ('Sophia Williams', 'sophia.w@example.com', '+1 (555) 123-4567', 'New York', 'USA'),
  ('Liam Brown', 'liam.b@example.com', '+44 20 1234 5678', 'London', 'UK'),
  ('Emma Davis', 'emma.d@example.com', '+61 2 1234 5678', 'Sydney', 'Australia'),
  ('Noah Johnson', 'noah.j@example.com', '+1 (555) 987-6543', 'Los Angeles', 'USA'),
  ('Olivia Martinez', 'olivia.m@example.com', '+34 91 123 4567', 'Madrid', 'Spain');
