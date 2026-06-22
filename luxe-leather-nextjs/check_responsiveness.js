const fs = require('fs');
const path = require('path');

function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory() && !['node_modules', '.next', 'public'].includes(file)) {
      scanDirectory(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = scanDirectory(path.join(__dirname, 'app'));
files.push(...scanDirectory(path.join(__dirname, 'components')));

let issuesFound = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for hardcoded pixel widths without max-w-full
    if (/w-\[\d+px\]/.test(line) && !line.includes('max-w-full')) {
      issuesFound.push(`[Hardcoded Width] ${file.split('/luxe-leather-nextjs/')[1]}:${index + 1} -> ${line.trim().substring(0, 80)}`);
    }
    
    // Check for fixed w-96 or larger without max-w-full
    if (/(w-96|w-80|w-72|w-64)/.test(line) && !line.includes('max-w-full') && !line.includes('md:w-') && !line.includes('lg:w-') && !line.includes('sm:w-')) {
       // Only flag if it's not part of a sidebar or clearly responsive container
       if (!file.includes('Sidebar') && !file.includes('layout')) {
         issuesFound.push(`[Large Fixed Width] ${file.split('/luxe-leather-nextjs/')[1]}:${index + 1} -> ${line.trim().substring(0, 80)}`);
       }
    }

    // Check for tables without overflow wrapper
    // We assume tables are wrapped in a div with overflow-x-auto or overflow-auto.
    // This is harder to check line-by-line, so we'll skip for now as AdminTable handles it.
  });
}

console.log(`Found ${issuesFound.length} potential responsiveness issues.`);
issuesFound.forEach(i => console.log(i));
