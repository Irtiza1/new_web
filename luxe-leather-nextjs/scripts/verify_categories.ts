
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

async function verifyCategories() {
    console.log("Verifying product categories...");

    const { data: products, error } = await supabase
        .from('Product')
        .select('category');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    const counts = {};
    products.forEach(p => {
        counts[p.category] = (counts[p.category] || 0) + 1;
    });

    console.log("Category Counts:");
    console.table(counts);
}

verifyCategories();
