import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { auditLog, auditLogBulk } from '@/lib/services/auditService';

const couponSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    discount_type: z.string().optional(),
    value: z.number().min(0).optional(),
    min_order_amount: z.number().nullable().optional(),
    max_uses: z.number().int().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
}).passthrough();


export const dynamic = 'force-dynamic';

// Full CRUD for coupons — used by the admin panel
// (The GET /api/coupons?code=X endpoint is for storefront validation)

export async function GET() {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {

        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
    const body = await request.json();
    const result = couponSchema.safeParse(body);
    if (!result.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('coupons').insert([result.data]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('coupons', data.id, 'CREATE', { code: { from: null, to: data.code } });
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const updateResult = couponSchema.partial().passthrough().safeParse(body);
    if (!updateResult.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: updateResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('coupons').update(updateResult.data).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('coupons', data.id, 'UPDATE');
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

    const { error } = await supabase.from('coupons').delete().in('id', idsToDelete);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    await auditLogBulk('coupons', idsToDelete, 'DELETE');
    return NextResponse.json({ success: true });
}
