require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanSizeGuide() {
  const table = 'SizeGuide';
  console.log(`Checking table: ${table}...`);
  
  // Try to delete using .not('id', 'is', null)
  let { error: deleteError } = await supabase.from(table).delete().not('id', 'is', null);
  
  if (deleteError && deleteError.message.includes('column "id" does not exist')) {
    console.log('No "id" column, trying created_at...');
    let res2 = await supabase.from(table).delete().not('created_at', 'is', null);
    deleteError = res2.error;
  }
  
  if (deleteError && deleteError.message.includes('column "created_at" does not exist')) {
      console.log('No "created_at" column, trying to delete by matching anything...');
      // If there's no id or created_at, just match something we know might exist, or use a dummy filter
      // E.g. gte some other column if we know it. But let's hope it has id or created_at.
      // We can also try a string match.
      let res3 = await supabase.from(table).delete().neq('random_col_that_doesnt_exist', 'dummy');
      deleteError = res3.error;
  }

  if (deleteError) {
    console.error(`Failed to clear ${table}:`, deleteError);
  } else {
    console.log(`Successfully cleared ${table}!`);
  }
}

cleanSizeGuide();
