import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as productService from '../../../lib/services/productService';
import { apiHandler } from '../../../lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// ===================================
// VALIDATION SCHEMAS
// ===================================

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    stock: z.number().int().min(0, 'Stock must be non-negative'),
    category: z.string().min(1, 'Category is required'),
    images: z.array(z.string()).optional(),
    is_featured: z.boolean().optional(),
    featured_tag: z.string().nullable().optional(),
    sizes: z.array(z.string()).optional(),
    specs: z.array(z.any()).optional(),
    colors: z.array(z.any()).optional(),
    allow_custom_sizing: z.boolean().optional(),
    custom_sizing_price: z.number().optional(),
    shipping_info: z.any().optional(),
});

const querySchema = z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    includeInactive: z.string().optional(), // 'true' to include archived products (admin only)
});

// ===================================
// ROUTES
// ===================================

/**
 * @route   GET /api/products
 * @desc    Get all products
 */
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    const includeInactive = query.includeInactive === 'true';

    const products = await productService.getAll(query, includeInactive);

    return NextResponse.json({
        success: true,
        data: products,
    });
});

/**
 * @route   POST /api/products
 * @desc    Create a product
 */
export const POST = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const data = productSchema.parse(body);

    // Map the first image to the main `image` column for legacy support,
    // but ensure the entire `images` array is also saved to the database.
    const productData: Record<string, unknown> = { ...data };
    if (data.images && data.images.length > 0) {
        productData.image = data.images[0];
        productData.images = data.images;
    } else {
        productData.image = '';
        productData.images = [];
    }

    const product = await productService.create(productData);
    revalidatePath('/', 'layout');

    return NextResponse.json({
        success: true,
        data: product,
    }, { status: 201 });
});

/**
 * @route   PUT /api/products
 * @desc    Update a product
 */
export const PUT = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });

    const body = await req.json();
    const product = await productService.update(id, body);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data: product });
});

/**
 * @route   DELETE /api/products
 * @desc    Delete a product
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    let idsToDelete: string[] = [];

    if (id) {
        idsToDelete = [id];
    } else {
        try {
            const body = await req.json();
            if (body.ids && Array.isArray(body.ids)) {
                idsToDelete = body.ids;
            }
        } catch {}
    }

    if (idsToDelete.length === 0) return NextResponse.json({ success: false, message: 'Product ID(s) required' }, { status: 400 });

    const result = await productService.removeBulk(idsToDelete);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: 'Products deleted successfully', deleted: result.deleted });
});
