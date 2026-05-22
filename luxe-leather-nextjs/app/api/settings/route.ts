import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as settingsService from '@/lib/services/settingsService';
import { apiHandler } from '@/lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// Schema for updating settings (flexible key-value)
const updateSchema = z.record(z.string(), z.string());

export const GET = apiHandler(async () => {
    const settings = await settingsService.getAll();
    return NextResponse.json({
        success: true,
        data: settings,
    });
});

export const PUT = apiHandler(async (req: NextRequest) => {
    const body = await req.json();
    const validatedData = updateSchema.parse(body);

    await settingsService.update(validatedData);
    revalidatePath('/', 'layout');

    return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
    });
});
