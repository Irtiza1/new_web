const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
    try {
        console.log('Logging in to get auth token...');
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: 'irtiza.s2918@gmail.com',
            password: 'LuxeAdmin123!'
        });

        if (error) {
            console.error('Login failed:', error.message);
            return;
        }

        const cookie = `sb-access-token=${encodeURIComponent(authData.session.access_token)}; sb-refresh-token=${encodeURIComponent(authData.session.refresh_token)}`;

        // 1. Categories
        console.log("\n--- Testing Categories ---");
        const catRes = await fetch("http://localhost:3000/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": cookie },
            body: JSON.stringify({ name: "Test Cat", slug: "test-cat-" + Date.now() })
        });
        const catData = await catRes.json();
        if (catData.success) {
            const delCat = await fetch("http://localhost:3000/api/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Cookie": cookie },
                body: JSON.stringify({ ids: [catData.data.id] })
            });
            console.log("Categories Bulk Delete:", (await delCat.json()).success ? "SUCCESS" : "FAILED");
        }

        // 2. Shipping Zones
        console.log("\n--- Testing Shipping Zones ---");
        const shipRes = await fetch("http://localhost:3000/api/shipping-zones", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": cookie },
            body: JSON.stringify({ name: "Test Zone", regions: "Test", handling_days: 1, rate: 10, is_active: true })
        });
        const shipData = await shipRes.json();
        if (shipData.success) {
            const delShip = await fetch("http://localhost:3000/api/shipping-zones", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Cookie": cookie },
                body: JSON.stringify({ ids: [shipData.data.id] })
            });
            console.log("Shipping Zones Bulk Delete:", (await delShip.json()).success ? "SUCCESS" : "FAILED");
        }

        // 3. Nav Items
        console.log("\n--- Testing Nav Items ---");
        const navRes = await fetch("http://localhost:3000/api/nav-items", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": cookie },
            body: JSON.stringify({ title: "Test Nav", url: "/test", display_order: 1 })
        });
        const navData = await navRes.json();
        if (navData.success) {
            const delNav = await fetch("http://localhost:3000/api/nav-items", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Cookie": cookie },
                body: JSON.stringify({ ids: [navData.data.id] })
            });
            console.log("Nav Items Bulk Delete:", (await delNav.json()).success ? "SUCCESS" : "FAILED");
        }

    } catch (err) {
        console.error(err);
    }
}
runTests();
