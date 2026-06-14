-- Add images array column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Optional: Migrate existing single images into the array
UPDATE products 
SET images = ARRAY[image] 
WHERE image IS NOT NULL AND image != '' AND array_length(images, 1) IS NULL;
