import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as requestService from '@/lib/services/requestService';
import { apiHandler } from '@/lib/middleware/apiHandler';
import { AppError } from '@/lib/utils/AppError';

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
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    itemType: z.string().min(1, 'Item type is required'),
    description: z.string().min(1, 'Description is required'),
    phone: z.string().optional(),
    budget: z.string().optional(),
    deadline: z.string().optional(),
    images: z.array(z.string()).optional(),
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

    const newRequest = await requestService.create(validatedData);

    return NextResponse.json({
        success: true,
        data: newRequest,
    }, { status: 201 });
});
