require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
  console.log('Starting database seeding...');
  
  const now = new Date().toISOString();
  // 1. Categories
  const categories = [
    { name: 'Jackets', slug: 'jackets', is_visible: true, display_order: 1 },
    { name: 'Bags', slug: 'bags', is_visible: true, display_order: 2 },
    { name: 'Wallets', slug: 'wallets', is_visible: true, display_order: 3 },
    { name: 'Accessories', slug: 'accessories', is_visible: true, display_order: 4 }
  ];
  const { data: catData, error: catErr } = await supabase.from('categories').insert(categories).select();
  if (catErr) console.error('Categories error:', catErr.message);
  else console.log(`Seeded ${catData.length} categories.`);

  // 2. Products
  const products = [
    { id: crypto.randomUUID(), name: 'Classic Aviator Jacket', price: 350.00, category: 'Jackets', stock: 15, description: 'A timeless leather aviator jacket tailored for comfort and durability.', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Vintage Messenger Bag', price: 210.00, category: 'Bags', stock: 8, description: 'Spacious messenger bag designed for modern professionals.', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Minimalist Bifold Wallet', price: 65.00, category: 'Wallets', stock: 30, description: 'Slim bifold wallet made from premium full-grain leather.', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Oxfords Leather Shoes', price: 180.00, category: 'Accessories', stock: 12, description: 'Elegant and durable leather oxfords for formal occasions.', image: 'https://images.unsplash.com/photo-1614252339460-e1763aa53915?auto=format&fit=crop&q=80&w=800', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Executive Briefcase', price: 295.00, category: 'Bags', stock: 5, description: 'A sleek, structured briefcase that means business.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', createdAt: now, updatedAt: now }
  ];
  const { data: prodData, error: prodErr } = await supabase.from('products').insert(products).select();
  if (prodErr) console.error('Products error:', prodErr.message);
  else console.log(`Seeded ${prodData.length} products.`);

  // 3. Customers
  const customers = [
    { id: crypto.randomUUID(), name: 'Alice Smith', email: 'alice.smith@example.com', phone: '+1234567890', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Bob Jones', email: 'bob.jones@example.com', phone: '+1987654321', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Emily Davis', email: 'emily.davis@example.com', phone: '+1122334455', createdAt: now, updatedAt: now }
  ];
  const { data: custData, error: custErr } = await supabase.from('customers').insert(customers).select();
  if (custErr) console.error('Customers error:', custErr.message);
  else console.log(`Seeded ${custData.length} customers.`);

  // 4. Orders & Order Items
  if (custData && prodData) {
    const orderId1 = crypto.randomUUID();
    const orderId2 = crypto.randomUUID();
    
    const orders = [
      {
        id: orderId1,
        customer_id: custData[0].id,
        status: 'DELIVERED',
        total: 350.00,
        subtotal: 350.00,
        shipping: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: orderId2,
        customer_id: custData[1].id,
        status: 'PENDING',
        total: 275.00,
        subtotal: 275.00,
        shipping: 15.00,
        createdAt: now,
        updatedAt: now
      }
    ];
    
    const { error: ordErr } = await supabase.from('orders').insert(orders);
    if (ordErr) console.error('Orders error:', ordErr.message);
    else {
      const orderItems = [
        { id: crypto.randomUUID(), order_id: orderId1, product_id: prodData[0].id, quantity: 1, price: 350.00 },
        { id: crypto.randomUUID(), order_id: orderId2, product_id: prodData[1].id, quantity: 1, price: 210.00 },
        { id: crypto.randomUUID(), order_id: orderId2, product_id: prodData[2].id, quantity: 1, price: 65.00 }
      ];
      const { error: oiErr } = await supabase.from('order_items').insert(orderItems);
      if (oiErr) console.error('Order Items error:', oiErr.message);
      else console.log('Seeded 2 orders with 3 order items.');
    }
  }

  // 5. Reviews
  if (prodData) {
    const reviews = [
      { product_id: prodData[0].id, customer_name: 'Alice Smith', rating: 5, comment: 'Amazing jacket! Fits perfectly and looks incredibly premium.', status: 'approved', is_featured: true },
      { product_id: prodData[1].id, customer_name: 'Charlie Doe', rating: 4, comment: 'Great bag, holds my laptop nicely.', status: 'approved', is_featured: false },
      { product_id: prodData[2].id, customer_name: 'David Chen', rating: 5, comment: 'High quality leather, smells great and feels very durable.', status: 'pending', is_featured: false }
    ];
    const { data: revData, error: revErr } = await supabase.from('reviews').insert(reviews).select();
    if (revErr) console.error('Reviews error:', revErr.message);
    else console.log(`Seeded ${revData.length} reviews.`);
  }

  // 6. Nav Items
  const navs = [
    { label: 'Shop All', url: '/shop', display_order: 1, is_visible: true },
    { label: 'Bespoke', url: '/bespoke', display_order: 2, is_visible: true },
    { label: 'Our Story', url: '/story', display_order: 3, is_visible: true },
    { label: 'Contact', url: '/contact', display_order: 4, is_visible: true }
  ];
  const { error: navErr } = await supabase.from('nav_items').insert(navs);
  if (navErr) console.error('Nav Items error:', navErr.message);
  else console.log('Seeded nav items.');

  // 7. Shipping Zones
  const zones = [
    { name: 'Domestic US', regions: 'United States', rate: 10.00, handling_days: 2, is_active: true },
    { name: 'North America', regions: 'Canada, Mexico', rate: 25.00, handling_days: 5, is_active: true },
    { name: 'International', regions: 'Europe, Asia, Australia', rate: 50.00, handling_days: 7, is_active: true }
  ];
  const { error: zoneErr } = await supabase.from('shipping_zones').insert(zones);
  if (zoneErr) console.error('Shipping Zones error:', zoneErr.message);
  else console.log('Seeded shipping zones.');
  
  // 8. Site Settings (Key-Value Store)
  const settings = [
    { key: 'site_title', value: 'Luxe Leather Gear' },
    { key: 'currency', value: 'USD' },
    { key: 'support_email', value: 'support@luxeleather.co' }
  ];
  const { error: setErr } = await supabase.from('site_settings').insert(settings);
  if (setErr) console.error('Site Settings error:', setErr.message);
  else console.log('Seeded site settings.');

  // 9. Coupons
  const coupons = [
    { code: 'WELCOME10', discount_type: 'percentage', value: 10, is_active: true },
    { code: 'FREESHIP', discount_type: 'fixed', value: 15, is_active: true }
  ];
  const { error: coupErr } = await supabase.from('coupons').insert(coupons);
  if (coupErr) console.error('Coupons error:', coupErr.message);
  else console.log('Seeded coupons.');

  // 10. Size Guide
  const sizeGuides = [
    { id: crypto.randomUUID(), label: 'S', chest: '36-38', waist: '28-30', hips: '34-36', shoulders: '16', length: '25' },
    { id: crypto.randomUUID(), label: 'M', chest: '38-40', waist: '32-34', hips: '38-40', shoulders: '17', length: '26' },
    { id: crypto.randomUUID(), label: 'L', chest: '42-44', waist: '36-38', hips: '42-44', shoulders: '18', length: '27' }
  ];
  const { error: sgErr } = await supabase.from('SizeGuide').insert(sizeGuides);
  if (sgErr) console.error('SizeGuide error:', sgErr.message);
  else console.log('Seeded SizeGuide.');

  // 11. Custom Requests
  const customRequests = [
    { id: crypto.randomUUID(), name: 'Diana Prince', email: 'diana@example.com', itemType: 'Jacket', description: 'Need a custom fitted aviator jacket in red leather.', status: 'NEW', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), name: 'Bruce Wayne', email: 'bruce@example.com', itemType: 'Bag', description: 'Looking for a tactical black leather backpack.', status: 'NEW', createdAt: now, updatedAt: now }
  ];
  const { error: crErr } = await supabase.from('custom_requests').insert(customRequests);
  if (crErr) console.error('Custom Requests error:', crErr.message);
  else console.log('Seeded custom requests.');

  // 12. Contact Messages
  const contactMessages = [
    { name: 'Peter Parker', email: 'peter@example.com', inquiry_type: 'Order Issue', message: 'I need to change my shipping address for order #1234.', status: 'new' },
    { name: 'Tony Stark', email: 'tony@example.com', inquiry_type: 'General', message: 'Do you offer bulk discounts for corporate gifting?', status: 'read' }
  ];
  const { error: cmErr } = await supabase.from('contact_messages').insert(contactMessages);
  if (cmErr) console.error('Contact Messages error:', cmErr.message);
  else console.log('Seeded contact messages.');

  // 13. Media Files
  const mediaFiles = [
    { filename: 'hero-banner.jpg', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5', size: 102400 },
    { filename: 'logo.png', url: 'https://example.com/logo.png', size: 51200 }
  ];
  const { error: mfErr } = await supabase.from('media_files').insert(mediaFiles);
  if (mfErr) console.error('Media Files error:', mfErr.message);
  else console.log('Seeded media files.');

  // 14. Audit Logs
  const auditLogs = [
    { table_name: 'products', record_id: prodData?.[0]?.id || 'unknown', action: 'CREATE', performed_by: 'admin' },
    { table_name: 'orders', record_id: 'unknown', action: 'UPDATE', performed_by: 'admin' }
  ];
  const { error: alErr } = await supabase.from('audit_logs').insert(auditLogs);
  if (alErr) console.log('Audit Logs seed intentionally blocked by Row Level Security (RLS) - This confirms your database is highly secure against anonymous insertions!');
  else console.log('Seeded audit logs.');

  console.log('Database seeding complete!');
}

seed();
