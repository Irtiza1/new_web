import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as productService from '../../../../lib/services/productService';
import { apiHandler } from '../../../../lib/middleware/apiHandler';

const idSchema = z.object({
    id: z.string().uuid(),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().min(1).optional(),
    images: z.array(z.string()).optional(),
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 */
export const GET = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = idSchema.parse(params);
    const product = await productService.getById(id);
    return NextResponse.json({ success: true, data: product });
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = idSchema.parse(params);
    const body = await req.json();
    const updates = updateProductSchema.parse(body);

    // Map images to image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...updates };
    if (updates.images && updates.images.length > 0) {
        updateData.image = updates.images[0];
    }

    const product = await productService.update(id, updateData);
    return NextResponse.json({ success: true, data: product });
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = idSchema.parse(params);
    await productService.remove(id);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
});
