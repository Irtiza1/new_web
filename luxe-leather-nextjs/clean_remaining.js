require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// We will attempt to delete from all plausible table names.
const possibleTables = [
  'contact_message', 'contact_messages', 'contact',
  'sizeGuide', 'size_guides', 'size_guide',
  'shipping_rates', 'shipping_rate',
  'site_content', 'site_contents',
  'site_settings', 'settings', 'site_setting'
];

async function forceCleanTables() {
  console.log('Attempting to clear remaining specific tables...');
  
  for (const table of possibleTables) {
    // .not('id', 'is', null) is universal if primary key is 'id'
    // Alternatively, just matching .gte('id', 0) or .neq('id', '00000000-0000-0000-0000-000000000000')
    // We'll use a trick: match everything by using an OR condition or something that is always true
    // Supabase requires a filter. .not('id', 'is', null) is usually perfect.
    
    // First, let's just try to fetch 1 row to see if the table exists
    const { error: checkError } = await supabase.from(table).select('*').limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      // Table doesn't exist, skip quietly
      continue;
    }
    
    if (checkError && checkError.code === 'PGRST204') {
        // Table doesn't exist, skip quietly
        continue;
    }
    
    if (checkError && checkError.message.includes('Could not find the table')) {
        continue;
    }

    console.log(`Found table: ${table}, attempting to delete rows...`);
    
    // Attempt delete
    // If the table doesn't have an 'id' column, this will fail. We'll catch it.
    let { error: deleteError } = await supabase.from(table).delete().not('id', 'is', null);
    
    if (deleteError && deleteError.message.includes('column "id" does not exist')) {
        // If no 'id', try another common PK or just catch all.
        // There's no universal 'delete all' without a filter in supabase-js.
        // Let's try created_at
        let res2 = await supabase.from(table).delete().not('created_at', 'is', null);
        deleteError = res2.error;
    }

    if (deleteError) {
      console.error(`  -> Failed to clear ${table}: ${deleteError.message}`);
    } else {
      console.log(`  -> Successfully cleared ${table}`);
    }
  }
  
  console.log('Cleanup attempt finished.');
}

forceCleanTables();
