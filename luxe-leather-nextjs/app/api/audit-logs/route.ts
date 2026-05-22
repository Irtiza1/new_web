import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as auditService from '../../../lib/services/auditService';
import { apiHandler } from '../../../lib/middleware/apiHandler';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
    tableName: z.string().optional(),
    recordId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});

/**
 * @route   GET /api/audit-logs
 * @desc    Get paginated audit log entries (admin only)
 */
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const result = await auditService.getAll({
        tableName: query.tableName,
        recordId: query.recordId,
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 50,
    });

    return NextResponse.json({ success: true, ...result });
});
