import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { requirePermission } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
    // Heavily secure this endpoint
    await requirePermission(req, 'requests:read');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    
    let query = supabaseAdmin
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
        throw error;
    }

    return NextResponse.json({
        success: true,
        data,
        pagination: { total: count || 0 }
    });
});

export const PUT = apiHandler(async (req: NextRequest) => {
    // Heavily secure this endpoint
    await requirePermission(req, 'requests:write');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID is required');

    const body = await req.json();
    
    const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .update({ status: body.status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
});

export const DELETE = apiHandler(async (req: NextRequest) => {
    // Heavily secure this endpoint
    await requirePermission(req, 'requests:write');

    const body = await req.json();
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
        throw new Error('IDs array is required');
    }

    const { error } = await supabaseAdmin
        .from('contact_messages')
        .delete()
        .in('id', body.ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
});
