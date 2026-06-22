const fs = require('fs');
const path = require('path');

const dir = 'supabase/migrations/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  if (file === '999_grants_and_setup.sql' || file === '00_prep_auth.sql') {
    fs.unlinkSync(path.join(dir, file));
    continue;
  }

  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // 1. Replace uuid_generate_v4
  content = content.replace(/extensions\.uuid_generate_v4\(\)/g, 'gen_random_uuid()');

  // 2. Remove ENABLE ROW LEVEL SECURITY
  content = content.replace(/ALTER TABLE (?:ONLY )?public\.[a-zA-Z0-9_"]+ ENABLE ROW LEVEL SECURITY;\n?/g, '');

  // 3. Remove CREATE POLICY blocks (from CREATE POLICY to ;)
  content = content.replace(/CREATE POLICY[^;]+;\n?/g, '');

  // 4. Update foreign keys from auth.users to public.users
  content = content.replace(/auth\.users\(id\)/g, 'public.users(id)');

  // Remove trailing multiple newlines
  content = content.replace(/\n\n\n+/g, '\n\n');

  fs.writeFileSync(path.join(dir, file), content.trim() + '\n');
}

console.log('Successfully scrubbed ' + files.length + ' files.');
