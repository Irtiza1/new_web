import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { auditLog } from '@/lib/services/auditService';

const categorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1),
    description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    display_order: z.number().int().optional(),
    is_visible: z.boolean().optional(),
}).passthrough();


export const dynamic = 'force-dynamic';

export async function GET() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

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
    const result = categorySchema.safeParse(body);
    if (!result.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('categories').insert([result.data]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('categories', data.id, 'CREATE', { name: { from: null, to: data.name } });
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const body = await request.json();
    const updateResult = categorySchema.partial().passthrough().safeParse(body);
    if (!updateResult.success) {
        return NextResponse.json({ success: false, message: 'Validation failed', errors: updateResult.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) }, { status: 400 });
    }
    const { data, error } = await supabase.from('categories').update(updateResult.data).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('categories', data.id, 'UPDATE');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    await auditLog('categories', id, 'DELETE');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
}
