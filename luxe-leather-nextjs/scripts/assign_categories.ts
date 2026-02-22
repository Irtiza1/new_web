
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    envVars[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
                }
            }
        });
        return envVars;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const categories = ['Jackets', 'Full Coats', 'Bags & Satchels', 'Accessories', 'Shoes'];

async function updateCategories() {
    console.log("Fetching Uncategorized products...");

    // Get all uncategorized products
    const { data: products, error } = await supabase
        .from('Product')
        .select('id, name')
        .eq('category', 'Uncategorized');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${products.length} uncategorized products.`);

    for (const product of products) {
        // Pick a random category
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        const { error: updateError } = await supabase
            .from('Product')
            .update({ category: randomCategory })
            .eq('id', product.id);

        if (updateError) {
            console.error(`Failed to update ${product.name}:`, updateError.message);
        } else {
            console.log(`Updated '${product.name}' -> ${randomCategory}`);
        }
    }

    console.log("Category assignment complete!");
}

updateCategories();
