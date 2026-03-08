import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as orderService from '../../../../lib/services/orderService';
import { apiHandler } from '../../../../lib/middleware/apiHandler';

const idSchema = z.object({
    id: z.string().min(1),
});

const updateOrderSchema = z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    // Add other updateable fields if necessary
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 */
export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const order = await orderService.getById(id);
    return NextResponse.json({ success: true, data: order });
});

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const body = await req.json();
    const updates = updateOrderSchema.parse(body);

    const order = await orderService.update(id, updates);
    return NextResponse.json({ success: true, data: order });
});

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    await orderService.remove(id);
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
});
