import { NextRequest, NextResponse } from 'next/server';
import * as mediaService from '@/lib/services/mediaService';
import { apiHandler } from '@/lib/middleware/apiHandler';

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    await mediaService.remove(id);
    return NextResponse.json({ success: true });
});
