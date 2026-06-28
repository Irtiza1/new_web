import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { auditLog, auditLogBulk } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

const sizeGuideSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    chest: z.string().optional().default(''),
    waist: z.string().optional().default(''),
    hips: z.string().optional().default(''),
    shoulders: z.string().optional().default(''),
    length: z.string().optional().default(''),
});

export const GET = apiHandler(async () => {
    const { data, error } = await supabase
        .from('SizeGuide')
        .select('*')
        .order('label', { ascending: true });

    if (error) {
        if (error.message.includes('does not exist')) {
            return NextResponse.json({ success: true, data: [] });
        }
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
});

export const POST = apiHandler(async (request: NextRequest) => {
    const body = await request.json();
    const parsed = sizeGuideSchema.parse(body);

    const { data, error } = await supabase.from('SizeGuide').insert([{ id: crypto.randomUUID(), ...parsed }]).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    await auditLog('size_guides', data.id, 'CREATE', { label: { from: null, to: data.label } });
    return NextResponse.json({ success: true, data });
});

export const PUT = apiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    
    const body = await request.json();
    const parsed = sizeGuideSchema.parse(body);

    const { data, error } = await supabase.from('SizeGuide').update(parsed).eq('id', id).select().single();
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    await auditLog('size_guides', data.id, 'UPDATE');
    return NextResponse.json({ success: true, data });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
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
    
    const { error } = await supabase.from('SizeGuide').delete().in('id', idsToDelete);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    
    await auditLogBulk('size_guides', idsToDelete, 'DELETE');
    return NextResponse.json({ success: true });
});
