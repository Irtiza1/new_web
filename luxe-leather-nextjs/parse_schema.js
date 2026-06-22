const fs = require('fs');

const sql = fs.readFileSync('supabase/public_schema_live.sql', 'utf8');

// A very simple split based on pg_dump format blocks.
// pg_dump usually separates statements by empty lines.
const blocks = sql.split(/\n\n+/);

const tableData = {};
const functions = [];
const other = [];

// Helper to get or create table bucket
function getTable(name) {
    if (!tableData[name]) tableData[name] = [];
    return tableData[name];
}

for (const block of blocks) {
    if (block.includes('SET statement_timeout') || block.includes('SET lock_timeout') || block.startsWith('--') && !block.includes('CREATE')) continue;
    
    // Check if it's a table creation
    let m = block.match(/CREATE TABLE public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        getTable(m[1].replace(/"/g, '')).push(block);
        continue;
    }
    
    // Check if it alters a table (owner, constraints, policies, RLS)
    m = block.match(/ALTER TABLE (?:ONLY )?public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        getTable(m[1].replace(/"/g, '')).push(block);
        continue;
    }

    // CREATE SEQUENCE
    m = block.match(/CREATE SEQUENCE public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        // usually named table_id_seq
        const seqName = m[1].replace(/"/g, '');
        const tbMatch = seqName.match(/(.+)_id_seq/);
        if (tbMatch && tableData[tbMatch[1]]) {
            getTable(tbMatch[1]).push(block);
        } else {
            other.push(block);
        }
        continue;
    }

    // ALTER SEQUENCE
    m = block.match(/ALTER SEQUENCE public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        const seqName = m[1].replace(/"/g, '');
        const tbMatch = seqName.match(/(.+)_id_seq/);
        if (tbMatch && tableData[tbMatch[1]]) {
            getTable(tbMatch[1]).push(block);
        } else {
            other.push(block);
        }
        continue;
    }
    
    // CREATE INDEX
    m = block.match(/CREATE (?:UNIQUE )?INDEX .+ ON public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        getTable(m[1].replace(/"/g, '')).push(block);
        continue;
    }

    // CREATE POLICY
    m = block.match(/CREATE POLICY .+ ON public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        getTable(m[1].replace(/"/g, '')).push(block);
        continue;
    }

    // CREATE TRIGGER
    m = block.match(/CREATE TRIGGER .+ (?:BEFORE|AFTER) (?:INSERT|UPDATE|DELETE) ON public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        getTable(m[1].replace(/"/g, '')).push(block);
        continue;
    }

    // CREATE FUNCTION
    if (block.match(/CREATE (OR REPLACE )?FUNCTION/)) {
        functions.push(block);
        continue;
    }
    
    // Default fallback
    if (block.trim() && !block.startsWith('-- PostgreSQL database dump')) {
        other.push(block);
    }
}

const tableOrder = [
    'site_settings', 'site_content', 'SizeGuide', 'categories', 'shipping_zones', 
    'shipping_rates', 'coupons', 'contact_messages', 'nav_items', 'traffic_events', 
    'media_files', 'custom_requests', 'audit_logs', 'customers', 'products', 
    'orders', 'order_items', 'reviews', 'cart_items', 'user_profiles', 'user_roles'
];

// Append missing ones to order
Object.keys(tableData).forEach(t => {
    if (!tableOrder.includes(t)) tableOrder.push(t);
});

// Create new directory
const outDir = 'supabase/migrations_new';
if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir);

let index = 1;
for (const tb of tableOrder) {
    if (tableData[tb]) {
        const num = String(index).padStart(3, '0');
        const filename = `${num}_${tb}.sql`;
        fs.writeFileSync(`${outDir}/${filename}`, tableData[tb].join('\n\n'));
        index++;
    }
}

if (functions.length > 0) {
    const num = String(index).padStart(3, '0');
    fs.writeFileSync(`${outDir}/${num}_functions.sql`, functions.join('\n\n'));
    index++;
}

if (other.length > 0) {
    fs.writeFileSync(`${outDir}/999_other.sql`, other.join('\n\n'));
}

console.log('Successfully generated ' + index + ' migration files in supabase/migrations_new/');
