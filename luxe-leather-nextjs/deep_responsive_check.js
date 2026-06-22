const fs = require('fs');
const path = require('path');

function scanDir(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', 'public', 'api'].includes(file)) scanDir(fullPath, files);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = scanDir(path.join(__dirname, 'app'));
allFiles.push(...scanDir(path.join(__dirname, 'components')));

let findings = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const shortName = file.split('luxe-leather-nextjs/')[1];

  lines.forEach((line, idx) => {
    // 1. Check for grid-cols-2+ without md: or sm: prefix (forces multi-col on mobile)
    const gridMatch = line.match(/(?<!sm:|md:|lg:|xl:|2xl:)grid-cols-([2-9]|1[0-2])/);
    if (gridMatch && !line.includes('grid-cols-1') && !line.includes('w-full')) {
      // Exclude Admin Filter Tabs or small components if necessary, but flag it
      findings.push(`[Hardcoded Grid] ${shortName}:${idx + 1} => ${gridMatch[0]}`);
    }

    // 2. Check for absolute/fixed elements that might overflow horizontally without left-0 right-0 or w-full
    if (line.includes('fixed ') && !line.includes('inset-0') && !line.includes('w-full') && !line.includes('right-') && !line.includes('w-screen')) {
      findings.push(`[Fixed Overflow Risk] ${shortName}:${idx + 1} => fixed element missing w-full/inset`);
    }

    // 3. Check for flex rows that might overflow (this is harder, but we can look for gap-8 without flex-wrap)
    if (line.includes('flex ') && line.includes('gap-8') && !line.includes('flex-wrap') && !line.includes('flex-col') && !line.includes('hidden')) {
      findings.push(`[Flex Overflow Risk] ${shortName}:${idx + 1} => flex with large gap without wrap/col`);
    }
  });
});

console.log(`Deep scan found ${findings.length} potential mobile layout breaks:`);
findings.forEach(f => console.log(f));
