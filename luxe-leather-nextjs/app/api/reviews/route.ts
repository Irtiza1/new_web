import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';

const reviewSchema = z.object({
    product_id: z.string().optional(),
    customer_name: z.string().min(1).optional(),
    customer_email: z.string().email().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    is_featured: z.boolean().optional(),
}).passthrough();


export const dynamic = 'force-dynamic';

export async function GET() {
    const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Reviews API Error:', JSON.stringify(error));

        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (data || []).map((r: any) => ({
        ...r,
        product_name: r.products?.name || null,
        products: undefined
    }));

    return NextResponse.json({ success: true, data: mapped });
}

export async function POST(request: Request) {
    const body = await request.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('reviews').insert([result.data]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('reviews', data.id, 'CREATE', { customer_name: { from: null, to: data.customer_name } });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const updateResult = reviewSchema.safeParse(body);
    if (!updateResult.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: updateResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('reviews').update(updateResult.data).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('reviews', data.id, 'UPDATE');
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

    const { error } = await supabase.from('reviews').delete().in('id', idsToDelete);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    for (const dId of idsToDelete) {
        await auditLog('reviews', dId, 'DELETE');
    }
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
}
