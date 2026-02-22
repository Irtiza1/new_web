import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(l => l.trim() && !l.startsWith('#'))
        .map(l => {
            const idx = l.indexOf('=');
            return [l.slice(0, idx), l.slice(idx + 1).trim()];
        })
);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllData() {
    const tables = [
        'CMSContent',
        'CartItem',
        'CustomRequest',
        'Customer',
        'Order',
        'OrderItem',
        'Product',
        'Setting',
        'ShippingRate',
        'SizeGuide'
    ];
    const dbData = {};

    for (const table of tables) {
        console.log(`Fetching data from ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
            dbData[table] = { error: error.message };
        } else {
            dbData[table] = data;
        }
    }

    const outputPath = path.join(__dirname, 'supabase-data-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(dbData, null, 2));
    console.log(`Data successfully exported to ${outputPath}`);
}

fetchAllData();
