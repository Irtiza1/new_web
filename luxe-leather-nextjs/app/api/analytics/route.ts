import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as analyticsService from '@/lib/services/analyticsService';
import { apiHandler } from '@/lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

// Schema for query parameters
const querySchema = z.object({
    type: z.enum(['summary', 'top-products', 'customers-by-country', 'traffic']).optional().default('summary'),
    limit: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let data;

    switch (query.type) {
        case 'summary':
            data = await analyticsService.getAnalyticsSummary();
            break;
        case 'top-products':
            const limit = query.limit ? parseInt(query.limit) : 5;
            data = await analyticsService.getTopProducts(limit);
            break;
        case 'customers-by-country':
            data = await analyticsService.getCustomersByCountry();
            break;
        case 'traffic':
            const start = query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const end = query.endDate || new Date().toISOString().split('T')[0];
            data = await analyticsService.getTrafficSummary(start, end);
            break;
    }

    return NextResponse.json({
        success: true,
        data,
    });
});
