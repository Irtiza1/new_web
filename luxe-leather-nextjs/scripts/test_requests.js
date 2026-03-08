
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    const { data, error, count } = await supabase
        .from('CustomRequest')
        .select('*', { count: 'exact' })
        .eq('status', 'new')
        .range(0, 0)
        .order('createdAt', { ascending: false });

    console.log('Error:', error);
    console.log('Data:', data);
    console.log('Count:', count);
}

test();
