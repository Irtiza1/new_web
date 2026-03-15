import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, message: 'Invalid or expired coupon code' }, { status: 404 });
        }

        // Check expiry if set
        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            return NextResponse.json({ success: false, message: 'This coupon has expired' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                code: data.code,
                discountType: data.discount_type,
                value: parseFloat(data.value),
                minOrderAmount: parseFloat(data.min_order_amount || 0)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
