import { NextRequest, NextResponse } from 'next/server';
import * as orderService from '@/lib/services/orderService';
import { apiHandler } from '@/lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 */
export const GET = apiHandler(async () => {
    const stats = await orderService.getStats();
    return NextResponse.json({ success: true, data: stats });
});
