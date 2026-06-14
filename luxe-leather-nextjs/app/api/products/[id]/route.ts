import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as productService from '../../../../lib/services/productService';
import { apiHandler } from '../../../../lib/middleware/apiHandler';
import { AppError } from '../../../../lib/utils/AppError';

export const dynamic = 'force-dynamic';

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
    is_featured: z.boolean().optional(),
    featured_tag: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    sizes: z.array(z.string()).optional(),
    specs: z.array(z.any()).optional(),
    colors: z.array(z.any()).optional(),
    allow_custom_sizing: z.boolean().optional(),
    custom_sizing_price: z.number().optional(),
    shipping_info: z.any().optional(),
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 */
export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const product = await productService.getById(id);
    return NextResponse.json({ success: true, data: product });
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const body = await req.json();
    const updates = updateProductSchema.parse(body);

    // Map the first image to the main `image` column for legacy support,
    // but ensure the entire `images` array is also saved to the database.
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.images && updates.images.length > 0) {
        updateData.image = updates.images[0];
        updateData.images = updates.images;
    } else if (updates.images && updates.images.length === 0) {
        updateData.image = '';
        updateData.images = [];
    }

    const product = await productService.update(id, updateData);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: product });
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product.
 *
 *   - If the product has NO order history  → hard delete (product row removed).
 *   - If the product HAS order history     → auto-fallback: archive (isActive=false).
 *     The response will include `archived: true` so the UI can show the right message.
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);

    try {
        await productService.remove(id);
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, message: 'Product permanently deleted.' });
    } catch (err) {
        // If removal was blocked due to order history, archive instead
        if (err instanceof AppError && err.code === 'CONFLICT') {
            const archived = await productService.archive(id);
            revalidatePath('/', 'layout');
            return NextResponse.json({
                success: true,
                archived: true,
                message: 'Product has order history and cannot be permanently deleted. It has been archived (hidden from storefront) instead.',
                data: archived,
            });
        }
        throw err; // re-throw anything else
    }
});

/**
 * @route   PATCH /api/products/:id/archive  (called via ?action=archive)
 * @route   PATCH /api/products/:id/restore  (called via ?action=restore)
 * @desc    Explicitly archive or restore a product
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'archive') {
        const product = await productService.archive(id);
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, message: 'Product archived.', data: product });
    }

    if (action === 'restore') {
        const product = await productService.restore(id);
        revalidatePath('/', 'layout');
        return NextResponse.json({ success: true, message: 'Product restored.', data: product });
    }

    throw new AppError('Invalid action. Use ?action=archive or ?action=restore', 400, 'VALIDATION_ERROR');
});
