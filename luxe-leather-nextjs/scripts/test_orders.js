const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    const { data, error, count } = await supabase
        .from('Order')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .range(0, 0)
        .order('createdAt', { ascending: false });

    console.log('Error pending:', error);
}

test();
