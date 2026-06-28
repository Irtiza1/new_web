import { supabase, supabaseAdmin, type CustomRequest } from '@/lib/supabase';
import { AppError } from '@/lib/utils/AppError';
import { auditLog, auditLogBulk } from './auditService';

export type { CustomRequest };

export interface RequestStats {
    total: number;
    new: number;
    quoted: number;
    in_progress: number;
    completed: number;
}

// Map from UI/API-friendly values to actual DB enum values
const STATUS_MAP: Record<string, string> = {
    'new': 'NEW',
    'quoted': 'QUOTE_SENT',
    'quote_sent': 'QUOTE_SENT',
    'in_progress': 'IN_PROGRESS',
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
};

function toDbStatus(status: string): string {
    const lower = status.toLowerCase();
    return STATUS_MAP[lower] || status.toUpperCase();
}

/**
 * Get all requests with optional filtering
 */
export const getAll = async (query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    includeArchived?: boolean;
}) => {
    let dbQuery = supabase
        .from('custom_requests')
        .select('*', { count: 'exact' });

    // Hide archived requests from normal admin views
    if (!query.includeArchived) {
        dbQuery = dbQuery.eq('isArchived', false);
    }

    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,itemType.ilike.%${query.search}%`);
    }

    dbQuery = dbQuery.order('createdAt', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    let results = (data as CustomRequest[]) || [];

    // Client-side status filter
    if (query.status && query.status !== 'all') {
        results = results.filter(r => r.status?.toLowerCase() === query.status?.toLowerCase());
    }

    // Client-side pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const from = (page - 1) * limit;
    const paginated = results.slice(from, from + limit);

    return {
        data: paginated,
        pagination: {
            total: results.length,
            page,
            limit,
            totalPages: Math.ceil(results.length / limit),
        },
    };
};

/**
 * Get request by ID
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('custom_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    return data as CustomRequest;
};

/**
 * Create new request
 */
export const create = async (request: Omit<CustomRequest, 'createdAt' | 'updatedAt' | 'status'>) => {
    const id = request.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const insertPayload = { ...request, id, status: 'NEW', isArchived: false, createdAt: now, updatedAt: now };
    
    const { data, error } = await supabase
        .from('custom_requests')
        .insert([insertPayload])
        .select()
        .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await auditLog('custom_requests', id, 'CREATE', { status: { from: null, to: 'NEW' } });
    return data as CustomRequest;
};

/**
 * Update request status
 */
export const updateStatus = async (id: string, status: string) => {
    const dbStatus = toDbStatus(status);
    const { data: before } = await supabase.from('custom_requests').select('status').eq('id', id).single();

    const { data, error } = await supabase
        .from('custom_requests')
        .update({ status: dbStatus })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await auditLog('custom_requests', id, 'UPDATE', {
        status: { from: before?.status ?? null, to: dbStatus },
    });
    return data as CustomRequest;
};

/**
 * Update request details
 */
export const update = async (id: string, updates: Partial<CustomRequest>) => {
    // Map status to DB enum value
    if (updates.status) {
        updates.status = toDbStatus(updates.status) as CustomRequest['status'];
    }

    // Strip read-only / auto-managed fields to avoid Supabase schema errors
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    const safeUpdates = updates;

    try {
        // Step 1: Perform the update (no .select() to avoid RLS RETURNING issues)
        const { error: updateError } = await supabase
            .from('custom_requests')
            .update(safeUpdates)
            .eq('id', id);

        if (updateError) {
            console.error('Supabase update error for CustomRequest:', JSON.stringify(updateError));
            throw new AppError(updateError.message, 500, 'DB_ERROR');
        }

        // Step 2: Re-fetch the updated record
        const { data, error: fetchError } = await supabase
            .from('custom_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw new AppError(fetchError.message, 500, 'DB_ERROR');
        return data as CustomRequest;
    } catch (err) {
        console.error('Failed to update request:', err);
        if (err instanceof AppError) throw err;
        throw new AppError(err instanceof Error ? err.message : 'Failed to update request', 500, 'DB_ERROR');
    }
};

/**
 * Hard delete a request and its associated images.
 */
export const remove = async (id: string) => {
    return removeBulk([id]);
};

/**
 * Hard delete multiple requests and their associated images.
 */
export const removeBulk = async (ids: string[]) => {
    if (!ids || ids.length === 0) return { success: true };

    // 1. Get the requests to find attached images
    const { data: requests } = await supabase
        .from('custom_requests')
        .select('inspiration')
        .in('id', ids);

    // 2. Delete the records permanently
    const { error } = await supabase
        .from('custom_requests')
        .delete()
        .in('id', ids);

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    // 3. Clean up attached images
    const filenames: string[] = [];
    const pureFilenames: string[] = [];

    requests?.forEach(req => {
        if (req.inspiration) {
            let urls: string[] = [];
            try {
                urls = JSON.parse(req.inspiration);
                if (!Array.isArray(urls)) urls = [req.inspiration];
            } catch {
                urls = [req.inspiration];
            }

            urls.forEach(url => {
                const parts = url.split('/');
                filenames.push('custom-orders/' + parts[parts.length - 1]);
                pureFilenames.push(parts[parts.length - 1] || '');
            });
        }
    });

    if (filenames.length > 0) {
        await supabaseAdmin.storage.from('media').remove(filenames);
        const validPure = pureFilenames.filter(Boolean);
        if (validPure.length > 0) {
            await supabaseAdmin.from('media_files').delete().in('filename', validPure);
        }
    }

    await auditLogBulk('custom_requests', ids, 'DELETE');
    
    return { success: true };
};

/**
 * Restore an archived request — sets isArchived = false.
 */
export const restore = async (id: string) => {
    const { data, error } = await supabase
        .from('custom_requests')
        .update({ isArchived: false } as Partial<CustomRequest>)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    await auditLog('custom_requests', id, 'RESTORE', { isArchived: { from: true, to: false } });
    return data as CustomRequest;
};

/**
 * Get request statistics
 */
export const getStats = async (): Promise<RequestStats> => {
    const { data, error } = await supabase
        .from('custom_requests')
        .select('status');

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');

    const stats = (data || []).reduce(
        (acc: Record<string, number>, curr) => {
            acc.total++;
            const status = curr.status?.toLowerCase() || 'new';
            if (acc[status] !== undefined) {
                acc[status]++;
            }
            return acc;
        },
        { total: 0, new: 0, quoted: 0, in_progress: 0, completed: 0 } as Record<string, number>
    );

    return stats as unknown as RequestStats;
};
