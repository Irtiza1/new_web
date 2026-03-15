import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as customerService from '../../../../lib/services/customerService';
import { apiHandler } from '../../../../lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for updating a customer
 */
const updateCustomerSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
});

/**
 * Schema for ID param
 */
const idSchema = z.object({
    id: z.string().min(1),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   GET /api/customers/:id
 * @desc    Get a single customer by ID
 * @access  Private
 * @param   {string} id - Customer UUID
 * @returns {Object} Customer data
 */
export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const customer = await customerService.getById(id);
    return NextResponse.json({ success: true, data: customer });
});

/**
 * @route   PUT /api/customers/:id
 * @desc    Update a customer
 * @access  Private
 * @param   {string} id - Customer UUID
 * @body    {Object} Partial customer data
 * @returns {Object} Updated customer data
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    const body = await req.json();
    const data = updateCustomerSchema.parse(body);

    const updated = await customerService.update(id, data);
    return NextResponse.json({ success: true, data: updated });
});

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete a customer
 * @access  Private
 * @param   {string} id - Customer UUID
 * @returns {Object} Success message
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = idSchema.parse(await params);
    await customerService.remove(id);
    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
});
