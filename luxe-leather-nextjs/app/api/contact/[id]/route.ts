import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as contactService from '@/lib/services/contactService';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { AppError } from '@/lib/utils/AppError';

const updateSchema = z.object({
    status: z.string().optional(),
});

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const message = await contactService.getById(params.id);
    if (!message) {
        throw new AppError('Message not found', 404);
    }
    return NextResponse.json({ success: true, data: message });
});

export const PUT = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    // Only status update supported for now
    if (validatedData.status) {
        // cast to any because we know it matches the string union if we validate it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await contactService.updateStatus(params.id, validatedData.status as any);
        return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: true, message: 'No updates performed' });
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    await contactService.remove(params.id);
    return NextResponse.json({ success: true });
});
