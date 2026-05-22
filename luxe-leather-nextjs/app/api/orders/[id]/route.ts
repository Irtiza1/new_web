import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as orderService from '../../../../lib/services/orderService';
import { apiHandler } from '../../../../lib/middleware/apiHandler';
import { AppError } from '../../../../lib/utils/AppError';

export const dynamic = 'force-dynamic';

const idSchema = z.object({
    id: z.string().min(1),
});

const updateOrderSchema = z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
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
 * @desc    Soft-delete an order (sets isDeleted=true). Orders are never hard-deleted.
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    await orderService.remove(id);
    return NextResponse.json({ success: true, message: 'Order archived successfully.' });
});

/**
 * @route   PATCH /api/orders/:id?action=restore
 * @desc    Restore a soft-deleted order
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'restore') {
        const order = await orderService.restore(id);
        return NextResponse.json({ success: true, message: 'Order restored.', data: order });
    }

    throw new AppError('Invalid action. Use ?action=restore', 400, 'VALIDATION_ERROR');
});
