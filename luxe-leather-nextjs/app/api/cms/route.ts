import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/lib/services/contentService';
import { apiHandler } from '@/lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
    const data = await contentService.getAll();
    return NextResponse.json({ success: true, data });
});

export const POST = apiHandler(async (request: NextRequest) => {
    const body = await request.json();
    const { slug, content, title, section, type } = body;
    
    if (!slug) {
        return NextResponse.json({ success: false, message: 'Slug is required' }, { status: 400 });
    }

    await contentService.upsertContentBySlug(slug, content || '', title, section, type);

    return NextResponse.json({ success: true, message: 'Content saved successfully' });
});
