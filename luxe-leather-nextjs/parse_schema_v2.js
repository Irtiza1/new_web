const fs = require('fs');
const sql = fs.readFileSync('supabase/public_schema_live.sql', 'utf8');

// Smarter split that respects $$ quoting
const blocks = [];
let currentBlock = '';
let inDollarQuote = false;
let dollarTag = '';

const lines = sql.split('\n');
for (const line of lines) {
    if (line.includes('$$')) {
        // Very basic toggle, assumes one $$ per line or matching pairs on same line
        const matches = line.match(/\$\$/g);
        if (matches && matches.length % 2 !== 0) {
            inDollarQuote = !inDollarQuote;
        }
    }
    
    currentBlock += line + '\n';
    
    if (line.trim() === '' && !inDollarQuote) {
        if (currentBlock.trim()) blocks.push(currentBlock.trim());
        currentBlock = '';
    }
}
if (currentBlock.trim()) blocks.push(currentBlock.trim());

const tableData = {};
const functions = [];
const other = [];

function getTable(name) {
    if (!tableData[name]) tableData[name] = [];
    return tableData[name];
}

for (const block of blocks) {
    if (block.includes('SET statement_timeout') || block.includes('SET lock_timeout') || block.startsWith('--') && !block.includes('CREATE')) continue;
    
    let m = block.match(/CREATE TABLE public\.([a-zA-Z0-9_"]+)/);
    if (m) { getTable(m[1].replace(/"/g, '')).push(block); continue; }
    
    m = block.match(/ALTER TABLE (?:ONLY )?public\.([a-zA-Z0-9_"]+)/);
    if (m) { getTable(m[1].replace(/"/g, '')).push(block); continue; }

    m = block.match(/CREATE SEQUENCE public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        const tbMatch = m[1].replace(/"/g, '').match(/(.+)_id_seq/);
        if (tbMatch && tableData[tbMatch[1]]) getTable(tbMatch[1]).push(block);
        else other.push(block);
        continue;
    }

    m = block.match(/ALTER SEQUENCE public\.([a-zA-Z0-9_"]+)/);
    if (m) {
        const tbMatch = m[1].replace(/"/g, '').match(/(.+)_id_seq/);
        if (tbMatch && tableData[tbMatch[1]]) getTable(tbMatch[1]).push(block);
        else other.push(block);
        continue;
    }
    
    m = block.match(/CREATE (?:UNIQUE )?INDEX .+ ON public\.([a-zA-Z0-9_"]+)/);
    if (m) { getTable(m[1].replace(/"/g, '')).push(block); continue; }

    m = block.match(/CREATE POLICY .+ ON public\.([a-zA-Z0-9_"]+)/);
    if (m) { getTable(m[1].replace(/"/g, '')).push(block); continue; }

    m = block.match(/CREATE TRIGGER .+ ON public\.([a-zA-Z0-9_"]+)/);
    if (m) { getTable(m[1].replace(/"/g, '')).push(block); continue; }

    if (block.match(/CREATE (OR REPLACE )?FUNCTION/)) {
        functions.push(block);
        continue;
    }
    
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

Object.keys(tableData).forEach(t => { if (!tableOrder.includes(t)) tableOrder.push(t); });

const outDir = 'supabase/migrations_new';
if (fs.existsSync(outDir)) { fs.rmSync(outDir, { recursive: true, force: true }); }
fs.mkdirSync(outDir);

let index = 1;
// Prepend enums to the first file (site_settings) or create a new file
let enums = other.filter(b => b.includes('CREATE TYPE'));
if (enums.length > 0) {
    fs.writeFileSync(`${outDir}/000_enums.sql`, enums.join('\n\n'));
}

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

// Write the grants and other things to a final setup script
const leftovers = other.filter(b => !b.includes('CREATE TYPE'));
if (leftovers.length > 0) {
    fs.writeFileSync(`${outDir}/999_grants_and_setup.sql`, leftovers.join('\n\n'));
}

console.log('Successfully generated ' + index + ' migration files in supabase/migrations_new/');
