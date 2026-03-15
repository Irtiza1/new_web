require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: res1 } = await supabase.from('site_content').update({ content: 'LIVE DIRECT ANNOUNCEMENT DB SQA TEST 2026' }).eq('slug', 'announcement_text').select();
    console.log("Updated DB:", res1);

    // Also add a product and see if it appears
    const newProduct = {
        name: 'SQA Integration Test Product',
        slug: 'sqa-integration-test-product',
        description: 'A test product for integration testing',
        price: 99.99,
        category_id: null,
        stock_quantity: 50,
        is_featured: true,
        images: ['https://via.placeholder.com/400']
    };
    const { data: res2, error } = await supabase.from('products').insert(newProduct).select();
    if (error && error.code === '23505') {
        console.log("Test product already exists.");
    } else {
        console.log("Created test product:", res2?.[0]?.name);
    }
}
check();
