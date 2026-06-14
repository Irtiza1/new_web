import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ success: true });
        }

        const ids = items.map(item => String(item.id));

        const { data: products, error } = await supabase
            .from('products')
            .select('id, name')
            .in('id', ids);

        if (error) {
            console.error('[validate-stock] DB error:', error);
            return NextResponse.json({ success: false, message: 'Failed to validate stock' }, { status: 500 });
        }

        for (const item of items) {
            const product = products?.find(p => String(p.id) === String(item.id));
            
            if (!product) {
                return NextResponse.json({
                    success: false,
                    message: `Product ${item.name} is no longer available.`
                });
            }
            // Stock checking logic removed
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[validate-stock] Error:', error);
        return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 });
    }
}
