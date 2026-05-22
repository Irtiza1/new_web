import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';


export const dynamic = 'force-dynamic';

const TABLE = 'shipping_zones';

const graceful = (error: any) => {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        return true;
    }
    return false;
};

export async function GET() {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true });
    if (error) {
        if (graceful(error)) return NextResponse.json({ success: true, data: [] });
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { data, error } = await supabase.from(TABLE).insert([body]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('shipping_zones', data.id, 'CREATE', { name: { from: null, to: data.name } });
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const { data, error } = await supabase.from(TABLE).update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('shipping_zones', data.id, 'UPDATE');
    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('shipping_zones', id, 'DELETE');
    return NextResponse.json({ success: true });
}
