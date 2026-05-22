import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as orderService from '../../../lib/services/orderService';
import { apiHandler } from '../../../lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// ===================================
// VALIDATION SCHEMAS
// ===================================

const querySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional()
});

const orderSchema = z.object({
    customer_id: z.string().min(1, 'Customer ID is required'),
    total: z.number().min(0),
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    items: z.array(z.object({
        product_id: z.string().min(1),
        quantity: z.number().min(1),
        price: z.number().min(0)
    }))
});

// ===================================
// ROUTES
// ===================================

/**
 * @route   GET /api/orders
 * @desc    Get all orders
 */
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const orders = await orderService.getAll(query);

    return NextResponse.json({
        success: true,
        data: orders,
    });
});

/**
 * @route   POST /api/orders
 * @desc    Create a order
 */
export const POST = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const data = orderSchema.parse(body);

    const order = await orderService.create(data);

    return NextResponse.json({
        success: true,
        data: order,
    }, { status: 201 });
});

/**
 * @route   PUT /api/orders
 * @desc    Update an order
 */
export const PUT = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

    const body = await req.json();
    const order = await orderService.update(id, body);
    return NextResponse.json({ success: true, data: order });
});

/**
 * @route   DELETE /api/orders
 * @desc    Delete an order
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

    await orderService.remove(id);
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
});
