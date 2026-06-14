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
    // Add other fields as necessary based on Supabase schema
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
    const productData: any = { ...data };
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
    if (!id) return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });

    await productService.remove(id);
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
});
