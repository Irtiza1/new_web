import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


export const dynamic = 'force-dynamic';

// Full CRUD for coupons — used by the admin panel
// (The GET /api/coupons?code=X endpoint is for storefront validation)

export async function GET() {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        if (error.message.includes('schema cache') || error.message.includes('does not exist') || error.message.includes('relation')) {
            return NextResponse.json({ success: true, data: [] });
        }
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { data, error } = await supabase.from('coupons').insert([body]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const { data, error } = await supabase.from('coupons').update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
