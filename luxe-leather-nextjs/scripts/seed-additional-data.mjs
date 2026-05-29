import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables (URL or Key)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting additional data seeding...');

    // 1. media_files
    console.log('Seeding media_files...');
    const mediaFiles = Array.from({ length: 15 }).map((_, i) => ({
        id: crypto.randomUUID(),
        filename: `leather-jacket-${i + 1}.webp`,
        url: `https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop&fm=webp`,
        content_type: 'image/webp',
        size: 1024 * 1024,
        folder: 'products',
        created_at: new Date().toISOString(),
    }));
    const { error: mediaError } = await supabase.from('media_files').insert(mediaFiles);
    if (mediaError) console.error('Failed to seed media_files:', mediaError.message);

    // 2. shipping_rates (Legacy table but user asked for it)
    console.log('Seeding shipping_rates...');
    const shippingRates = Array.from({ length: 10 }).map((_, i) => ({
        id: crypto.randomUUID(),
        region: `Global Region ${i + 1}`,
        standard: 15.99,
        express: 29.99,
        freeAbove: 200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }));
    const { error: ratesError } = await supabase.from('shipping_rates').insert(shippingRates);
    if (ratesError) console.error('Failed to seed shipping_rates:', ratesError.message);

    // 3. SizeGuide (Upsert by label)
    console.log('Seeding SizeGuide...');
    const sizeGuides = [
        { id: crypto.randomUUID(), label: 'Small', chest: '36-38"', waist: '28-30"', shoulders: '17"', length: '25"', hips: '34-36"' },
        { id: crypto.randomUUID(), label: 'Medium', chest: '38-40"', waist: '31-33"', shoulders: '18"', length: '26"', hips: '37-39"' },
        { id: crypto.randomUUID(), label: 'Large', chest: '40-42"', waist: '34-36"', shoulders: '19"', length: '27"', hips: '40-42"' },
        { id: crypto.randomUUID(), label: 'X-Large', chest: '42-44"', waist: '38-40"', shoulders: '20"', length: '28"', hips: '43-45"' },
    ];
    for (const sg of sizeGuides) {
        const { error } = await supabase.from('SizeGuide').upsert(sg, { onConflict: 'label' });
        if (error) console.error(`Failed to seed SizeGuide (${sg.label}):`, error.message);
    }

    // 4. shipping_zones (Active table)
    console.log('Seeding shipping_zones...');
    const zones = [
        { id: crypto.randomUUID(), name: 'North America', regions: 'USA, Canada, Mexico', handling_days: 7, rate: 0, free_above: 200, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Western Europe', regions: 'UK, France, Germany, Italy, Spain', handling_days: 10, rate: 25, free_above: 500, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Asia Pacific', regions: 'Japan, Australia, Singapore, South Korea', handling_days: 12, rate: 35, free_above: 600, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Middle East', regions: 'UAE, Saudi Arabia, Qatar, Kuwait', handling_days: 14, rate: 45, free_above: 800, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Eastern Europe', regions: 'Poland, Czech Republic, Hungary, Romania', handling_days: 12, rate: 30, free_above: 500, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'South America', regions: 'Brazil, Argentina, Chile, Colombia', handling_days: 15, rate: 40, free_above: 750, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Africa (North)', regions: 'Egypt, Morocco, Tunisia', handling_days: 15, rate: 50, free_above: 1000, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Africa (South)', regions: 'South Africa, Namibia, Botswana', handling_days: 18, rate: 55, free_above: 1200, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Scandinavia', regions: 'Sweden, Norway, Denmark, Finland', handling_days: 8, rate: 20, free_above: 400, is_active: true, created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), name: 'Southeast Asia', regions: 'Thailand, Vietnam, Malaysia, Philippines', handling_days: 14, rate: 35, free_above: 700, is_active: true, created_at: new Date().toISOString() },
    ];
    const { error: zonesError } = await supabase.from('shipping_zones').insert(zones);
    if (zonesError) console.error('Failed to seed shipping_zones:', zonesError.message);

    // 5. custom_requests
    console.log('Seeding custom_requests...');
    const requests = Array.from({ length: 15 }).map((_, i) => ({
        id: crypto.randomUUID(),
        name: `Custom Request Customer ${i + 1}`,
        email: `custom${i + 1}@example.com`,
        phone: `+1555000${i.toString().padStart(4, '0')}`,
        itemType: ['Jacket', 'Coat', 'Vest', 'Accessories'][i % 4],
        description: `Request #${i + 1}: Detailed requirement for a custom leather piece.`,
        status: ['NEW', 'QUOTE_SENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][i % 5],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    }));
    const { error: reqError } = await supabase.from('custom_requests').insert(requests);
    if (reqError) console.error('Failed to seed custom_requests:', reqError.message);

    // 6. orders and order_items
    console.log('Seeding orders and order_items...');
    const { data: custs } = await supabase.from('customers').select('id').limit(10);
    const { data: prods } = await supabase.from('products').select('id, price').limit(10);

    if (custs && prods && custs.length > 0 && prods.length > 0) {
        for (let i = 0; i < 12; i++) {
            const orderId = crypto.randomUUID();
            const customerId = custs[i % custs.length].id;
            const product = prods[i % prods.length];
            const now = new Date(Date.now() - i * 3600000).toISOString();

            const { error: orderErr } = await supabase.from('orders').insert([{
                id: orderId,
                customer_id: customerId,
                status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][i % 4],
                subtotal: product.price,
                shipping: 15,
                total: product.price + 15,
                createdAt: now,
                updatedAt: now
            }]);

            if (!orderErr) {
                await supabase.from('order_items').insert([{
                    id: crypto.randomUUID(),
                    order_id: orderId,
                    product_id: product.id,
                    quantity: 1,
                    price: product.price,
                    size: 'L'
                }]);
            }
        }
    }

    // 7. cart_items
    console.log('Seeding cart_items...');
    if (prods && prods.length > 0) {
        const cartItems = Array.from({ length: 15 }).map((_, i) => ({
            id: crypto.randomUUID(),
            sessionId: `session-id-${i + 1}`,
            product_id: prods[i % prods.length].id,
            quantity: 1,
            size: ['S', 'M', 'L', 'XL'][i % 4],
            createdAt: new Date().toISOString(),
        }));
        const { error: cartError } = await supabase.from('cart_items').insert(cartItems);
        if (cartError) console.error('Failed to seed cart_items:', cartError.message);
    }

    console.log('Seeding completed successfully!');
}

seed().catch(console.error);
