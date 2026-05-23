const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pgcprmhaalolzjvqfwyo.supabase.co', 'sb_publishable_yGXDthhibr_RxNtLjtE_TA_7ZxE_Xri');
async function run() {
  const { data } = await supabase.from('media_files').select('*');
  console.log('media_files count:', data.length);
  
  const { data: storageList } = await supabase.storage.from('media').list('platform-images');
  console.log('Storage files in platform-images:', storageList.map(f => f.name));
}
run();
