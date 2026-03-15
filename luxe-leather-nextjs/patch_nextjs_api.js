const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const apiRoutes = globSync('app/api/**/route.ts');
console.log(`Found ${apiRoutes.length} route files.`);

let patchedCount = 0;

apiRoutes.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    if (content.includes('export async function GET()') && !content.includes('force-dynamic')) {
        // Find import section end
        const importRegex = /^import .+?;?$/gm;
        let match;
        let lastImportIndex = 0;

        while ((match = importRegex.exec(content)) !== null) {
            lastImportIndex = match.index + match[0].length;
        }

        const insertPosition = lastImportIndex === 0 ? 0 : lastImportIndex + 1;

        const insertString = `\n\nexport const dynamic = 'force-dynamic';\n`;

        content = content.slice(0, insertPosition) + insertString + content.slice(insertPosition);
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
        patchedCount++;
    }
});

console.log(`Patched ${patchedCount} files.`);
