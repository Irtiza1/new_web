require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_SLUG = 'postman_test_crud_slug_123';

async function testCompleteCRUD() {
    console.log("=== STARTING COMPLETE CRUD TEST ===");

    // 1. CREATE (Insert)
    console.log("\n[1/5] Testing CREATE (Insert)...");
    let { data: existing } = await supabase.from('site_content').select('id').eq('slug', TEST_SLUG).maybeSingle();
    
    if (!existing) {
        const { error: insertErr } = await supabase.from('site_content').insert([{
            slug: TEST_SLUG,
            content: 'Initial Test Content',
            description: 'CMS Content',
            content_type: 'text'
        }]);
        if (insertErr) throw new Error("Insert Failed: " + insertErr.message);
        console.log("✅ Insert Successful!");
    } else {
        console.log("✅ Already existed, skipping insert.");
    }

    // 2. READ (After Create)
    console.log("\n[2/5] Testing READ...");
    const { data: readData, error: readErr } = await supabase.from('site_content').select('content').eq('slug', TEST_SLUG).maybeSingle();
    if (readErr) throw new Error("Read Failed: " + readErr.message);
    console.log("✅ Read Successful! Content ->", readData.content);

    // 3. UPDATE
    console.log("\n[3/5] Testing UPDATE...");
    const { data: idData } = await supabase.from('site_content').select('id').eq('slug', TEST_SLUG).maybeSingle();
    const { error: updateErr } = await supabase.from('site_content').update({ content: 'UPDATED Test Content' }).eq('id', idData.id);
    if (updateErr) throw new Error("Update Failed: " + updateErr.message);
    console.log("✅ Update Successful!");

    // 4. READ (After Update)
    console.log("\n[4/5] Testing READ (Verify Update)...");
    const { data: readData2 } = await supabase.from('site_content').select('content').eq('slug', TEST_SLUG).maybeSingle();
    console.log("✅ Read Successful! Content ->", readData2.content);
    if (readData2.content !== 'UPDATED Test Content') throw new Error("Update didn't actually save!");

    // 5. DELETE (Cleanup)
    console.log("\n[5/5] Testing DELETE (Cleanup)...");
    const { error: deleteErr } = await supabase.from('site_content').delete().eq('slug', TEST_SLUG);
    if (deleteErr) throw new Error("Delete Failed: " + deleteErr.message);
    console.log("✅ Delete Successful!");

    console.log("\n=== ALL CRUD TESTS PASSED FLAWLESSLY! ===");
}

testCompleteCRUD().catch(e => {
    console.error("\n❌ TEST FAILED:", e.message);
});
