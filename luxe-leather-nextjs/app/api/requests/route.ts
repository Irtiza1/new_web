import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as requestService from '@/lib/services/requestService';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { sendAdminCustomRequestNotification, sendCustomerCustomRequestConfirmation } from '@/lib/utils/email';

export const dynamic = 'force-dynamic';

// Schema for query parameters
const querySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
});

// Schema for creating a request
const createSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    itemType: z.string().min(1, 'Item type is required'),
    description: z.string().min(1, 'Description is required'),
    phone: z.string().optional(),
    budget: z.string().optional(),
    deadline: z.string().optional(),
    inspiration: z.string().optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const result = await requestService.getAll({
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        search: query.search,
        status: query.status,
    });

    return NextResponse.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
    });
});

export const POST = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const validatedData = createSchema.parse(body);

    const newRequest = await requestService.create({
        ...validatedData,
        id: validatedData.id || crypto.randomUUID(),
    });

    // Send email notifications (non-blocking for response if we wanted, but we await to ensure delivery attempt)
    // We ignore failures so the user still gets a success response if the DB inserted fine.
    await Promise.allSettled([
        sendAdminCustomRequestNotification({
            id: newRequest.id,
            ...validatedData,
        }),
        sendCustomerCustomRequestConfirmation(validatedData)
    ]);

    return NextResponse.json({
        success: true,
        data: newRequest,
    }, { status: 201 });
});

/**
 * @route   PUT /api/requests
 * @desc    Update a custom request
 */
export const PUT = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Request ID required' }, { status: 400 });

    const body = await req.json();
    const customReq = await requestService.update(id, body);
    return NextResponse.json({ success: true, data: customReq });
});

/**
 * @route   DELETE /api/requests
 * @desc    Delete a custom request
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

    if (idsToDelete.length === 0) return NextResponse.json({ success: false, message: 'Request ID(s) required' }, { status: 400 });

    await requestService.removeBulk(idsToDelete);
    return NextResponse.json({ success: true, message: 'Requests deleted successfully' });
});
