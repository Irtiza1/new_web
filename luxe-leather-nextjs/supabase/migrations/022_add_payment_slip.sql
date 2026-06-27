-- Add payment_slip_url to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_slip_url TEXT NOT NULL DEFAULT '';

-- Create the payment-receipts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to the payment-receipts bucket
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'payment-receipts');

-- Allow anyone to view the payment-receipts bucket (just in case the bucket public flag isn't enough for some environments)
CREATE POLICY "Allow public viewing" ON storage.objects FOR SELECT TO public USING (bucket_id = 'payment-receipts');
