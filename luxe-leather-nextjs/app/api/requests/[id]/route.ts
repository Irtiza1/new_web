import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as requestService from '@/lib/services/requestService';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { AppError } from '@/lib/utils/AppError';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
    status: z.string().optional(),
    budget: z.string().optional(),
    deadline: z.string().optional(),
    description: z.string().optional(),
    // Add other updateable fields
});

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const request = await requestService.getById(id);
    if (!request) {
        throw new AppError('Request not found', 404);
    }
    return NextResponse.json({ success: true, data: request });
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedRequest = await requestService.update(id, validatedData as any);

    return NextResponse.json({ success: true, data: updatedRequest });
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await requestService.remove(id);
    return NextResponse.json({ success: true, message: 'Request permanently deleted.' });
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'restore') {
        const request = await requestService.restore(id);
        return NextResponse.json({ success: true, message: 'Request restored.', data: request });
    }

    throw new AppError('Invalid action. Use ?action=restore', 400, 'VALIDATION_ERROR');
});
