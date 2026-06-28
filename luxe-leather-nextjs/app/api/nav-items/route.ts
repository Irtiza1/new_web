import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { auditLog, auditLogBulk } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .order('display_order', { ascending: true });

    // If the table doesn't exist yet (migration pending), return empty array
    // so the storefront Header gracefully falls back to static nav links
    if (error) {

        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { data, error } = await supabase.from('nav_items').insert([body]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('nav_items', data.id, 'CREATE', { label: { from: null, to: data.label } });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const { data, error } = await supabase.from('nav_items').update(body).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('nav_items', data.id, 'UPDATE');
    revalidatePath('/', 'layout');
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

    const { error } = await supabase.from('nav_items').delete().in('id', idsToDelete);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    await auditLogBulk('nav_items', idsToDelete, 'DELETE');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
}
