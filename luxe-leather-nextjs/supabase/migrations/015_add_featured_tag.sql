-- Migration 015: Add featured_tag to products table

ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "featured_tag" VARCHAR(50) DEFAULT NULL;
