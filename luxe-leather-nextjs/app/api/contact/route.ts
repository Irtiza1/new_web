import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as contactService from '@/lib/services/contactService';
import { apiHandler } from '@/lib/middleware/apiHandler';

// Schema for query parameters
const querySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
});

// Schema for creating a contact message
const createSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    inquiry_type: z.string().min(1, 'Inquiry type is required'),
    message: z.string().min(1, 'Message is required'),
});

export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const result = await contactService.getAll({
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

    const newMessage = await contactService.create(validatedData);

    return NextResponse.json({
        success: true,
        data: newMessage,
    }, { status: 201 });
});
