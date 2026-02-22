import fs from 'fs';

const jsonFile = 'supabase-data-export.json';
const schemaFile = 'supabase-schema.sql';
const outFile = '/Users/muhammadirtiza/.gemini/antigravity/brain/b19f89dc-bae7-44ac-a868-64945a98118b/walkthrough.md';

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
const schema = fs.readFileSync(schemaFile, 'utf-8');

let md = `# Database Schema and Data Export\n\n`;

md += `## 1. Original Database Schema\n\n`;
md += `This is the original proposed schema (\`supabase-schema.sql\`). However, note that the actual database tables differ in naming convention (e.g., \`Product\` instead of \`products\`).\n\n`;
md += "```sql\n" + schema + "\n```\n\n";

md += `## 2. Exported Data\n\n`;
md += `Below is a summary of the data retrieved from the live Supabase instance using the actual table names found in the application code.\n\n`;

for (const [table, records] of Object.entries(data)) {
    if (records.error) {
        md += `### ${table}\n`;
        md += `> [!WARNING]\n> ${records.error}\n\n`;
        continue;
    }

    md += `### Table: \`${table}\`\n`;
    md += `**Total Records:** ${records.length}\n\n`;

    if (records.length === 0) {
        md += `*No records found.*\n\n`;
        continue;
    }

    // Get headers
    const headers = Object.keys(records[0]);
    md += `| ` + headers.join(` | `) + ` |\n`;
    md += `| ` + headers.map(() => `---`).join(` | `) + ` |\n`;

    // Top 5 records
    const sample = records.slice(0, 15);
    for (const record of sample) {
        const row = headers.map(h => {
            let val = record[h];
            if (val === null) return '`null`';
            if (typeof val === 'object') return '`' + JSON.stringify(val).slice(0, 30) + (JSON.stringify(val).length > 30 ? '...' : '') + '`';
            let str = String(val).replace(/\n/g, ' ');
            if (str.length > 50) str = str.substring(0, 47) + '...';
            return str;
        });
        md += `| ` + row.join(` | `) + ` |\n`;
    }

    if (records.length > 15) {
        md += `\n*Note: Showing the first 15 of ${records.length} records. The full JSON export is saved locally at \`supabase-data-export.json\`.*\n`;
    }
    md += `\n`;
}

fs.writeFileSync(outFile, md);
console.log(`Report generated at ${outFile}`);
