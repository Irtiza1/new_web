import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as customerService from '../../../lib/services/customerService';
import { apiHandler } from '../../../lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for query parameters
 */
const querySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
});

/**
 * Schema for creating a new customer (Future refinement)
 * For now, minimal validation as per existing Customer type
 */
const createCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    status: z.string().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   GET /api/customers
 * @desc    Get all customers with optional searching and pagination
 * @access  Private - Requires authentication (TODO: Add Auth Middleware)
 * @query   {string} [page=1] - Page number
 * @query   {string} [limit=10] - Items per page
 * @query   {string} [search] - Search term
 * @returns {Object} Paginated list of customers
 */
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (email) {
        const customer = await customerService.getByEmail(email);
        return NextResponse.json({
            success: true,
            data: customer ? [customer] : [], // Return array for consistency or handle in client
        });
    }

    const query = querySchema.parse(Object.fromEntries(searchParams));

    const result = await customerService.getAll(query);

    return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
    });
});

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 * @body    {Object} Customer data
 * @returns {Object} Created customer
 */
export const POST = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const data = createCustomerSchema.parse(body);

    // Check if customer exists
    const existing = await customerService.getByEmail(data.email);
    if (existing) {
        return NextResponse.json({
            success: true,
            data: existing,
            message: 'Customer already exists',
        });
    }

    const customer = await customerService.create(data);

    return NextResponse.json({
        success: true,
        data: customer,
    }, { status: 201 });
});

/**
 * @route   PUT /api/customers
 * @desc    Update a customer
 */
export const PUT = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });

    const body = await req.json();
    const customer = await customerService.update(id, body);
    return NextResponse.json({ success: true, data: customer });
});

/**
 * @route   DELETE /api/customers
 * @desc    Delete (anonymize) a customer
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Customer ID required' }, { status: 400 });

    await customerService.remove(id);
    return NextResponse.json({ success: true, message: 'Customer anonymized successfully' });
});
