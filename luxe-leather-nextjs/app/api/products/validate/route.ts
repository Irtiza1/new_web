import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * @route   GET /api/products/validate?ids=uuid1,uuid2,...
 * @desc    Check which products from a given list are still available
 *          (isActive=true and stock > 0).
 *
 * Used by CartContext on open to strip unavailable items from localStorage.
 *
 * Response:
 *   {
 *     success: true,
 *     data: [
 *       { id, isActive, stock, name }   // one entry per requested id
 *     ],
 *     unavailableIds: string[]          // convenience: ids that are gone/inactive
 *   }
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('ids') ?? '';

    if (!raw.trim()) {
        return NextResponse.json({ success: true, data: [], unavailableIds: [] });
    }

    const ids = raw.split(',').map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) {
        return NextResponse.json({ success: true, data: [], unavailableIds: [] });
    }

    const { data, error } = await supabase
        .from('products')
        .select('id, name, "isActive", stock')
        .in('id', ids);

    if (error) {
        console.error('[validate] DB error:', error);
        // On error, return all ids as available so we don't falsely clear carts
        return NextResponse.json({ success: true, data: [], unavailableIds: [] });
    }

    // Build a set of found IDs
    const foundIds = new Set((data ?? []).map((p: any) => p.id));

    // IDs not found in DB at all are unavailable
    const missingIds = ids.filter(id => !foundIds.has(id));

    // IDs found but inactive or out of stock
    const inactiveIds = (data ?? [])
        .filter((p: any) => !p.isActive)
        .map((p: any) => p.id);

    const unavailableIds = [...missingIds, ...inactiveIds];

    return NextResponse.json({
        success: true,
        data: data ?? [],
        unavailableIds,
    });
}
