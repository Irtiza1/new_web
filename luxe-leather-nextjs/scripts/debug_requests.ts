
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {} as Record<string, string>);

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName: string) {
    console.log(`Checking table: ${tableName}`);
    const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });

    if (error) {
        console.error(`Error querying ${tableName}:`, error.message);
    } else {
        console.log(`Success! Found ${count} rows in ${tableName}.`);
        if (data && data.length > 0) {
            console.log('Sample Row Statuses:', data.map(r => r.status));
            console.log('Sample Row:', data[0]);
        } else {
            console.log('Table is empty.');
        }
    }
    console.log('---');
}

async function run() {
    await checkTable('CustomRequest');
    await checkTable('custom_requests');
    await checkTable('contact_messages');
    await checkTable('ContactMessage');
}

run();
