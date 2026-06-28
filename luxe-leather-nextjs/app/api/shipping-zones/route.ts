import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';


export const dynamic = 'force-dynamic';

const TABLE = 'shipping_zones';

const graceful = (error: { message?: string } | Error) => {
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
    let idsToDelete: string[] = [];

    if (id) {
        idsToDelete = [id];
    } else {
        try {
            const body = await request.json();
            if (body.ids && Array.isArray(body.ids)) {
                idsToDelete = body.ids;
            }
        } catch {}
    }

    if (idsToDelete.length === 0) return NextResponse.json({ success: false, message: 'ID(s) required' }, { status: 400 });

    const { error } = await supabase.from(TABLE).delete().in('id', idsToDelete);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    for (const dId of idsToDelete) {
        await auditLog('shipping_zones', dId, 'DELETE');
    }
    return NextResponse.json({ success: true });
}
