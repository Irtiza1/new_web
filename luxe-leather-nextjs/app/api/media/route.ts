import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as mediaService from '@/lib/services/mediaService';
import { apiHandler } from '@/lib/middleware/apiHandler';

// Schema for query parameters
const querySchema = z.object({
    folder: z.string().optional(),
    search: z.string().optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let data;
    if (query.search) {
        data = await mediaService.search(query.search);
    } else {
        data = await mediaService.getAll(query.folder);
    }

    return NextResponse.json({
        success: true,
        data,
    });
});

export const POST = apiHandler(async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const result = await mediaService.upload(file, folder);

    return NextResponse.json({
        success: true,
        data: result,
    }, { status: 201 });
});
