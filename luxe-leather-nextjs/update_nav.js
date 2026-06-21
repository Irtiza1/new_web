require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    // 1. Update the label and url
    const { data, error } = await supabase
        .from('nav_items')
        .update({ label: 'Custom Orders', url: '/custom-orders', is_visible: true })
        .or('label.eq.Bespoke,url.eq./bespoke,label.eq.Custom Orders');

    if (error) {
        console.error("Error updating nav_items:", error);
    } else {
        console.log("Successfully updated nav_items to Custom Orders and /custom-orders");
    }
}
main();
