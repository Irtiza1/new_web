import { supabase, type CustomRequest } from '@/lib/supabase';

export type { CustomRequest };

export interface RequestStats {
    total: number;
    new: number;
    quoted: number;
    in_progress: number;
    completed: number;
}

/**
 * Get all requests with optional filtering
 */
export const getAll = async (query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    let dbQuery = supabase
        .from('CustomRequest')
        .select('*', { count: 'exact' });

    // Apply filters
    if (query.status && query.status !== 'all') {
        dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,itemType.ilike.%${query.search}%`);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    dbQuery = dbQuery.range(from, to).order('createdAt', { ascending: false });

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    return {
        data: data as CustomRequest[],
        pagination: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        },
    };
};

/**
 * Get request by ID
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('CustomRequest')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as CustomRequest;
};

/**
 * Create new request
 */
export const create = async (request: Omit<CustomRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const { data, error } = await supabase
        .from('CustomRequest')
        .insert([{ ...request, status: 'new' }])
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
};

/**
 * Update request status
 */
export const updateStatus = async (id: string, status: CustomRequest['status']) => {
    const { data, error } = await supabase
        .from('CustomRequest')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
};

/**
 * Update request details
 */
export const update = async (id: string, updates: Partial<CustomRequest>) => {
    const { data, error } = await supabase
        .from('CustomRequest')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
};

/**
 * Delete request
 */
export const remove = async (id: string) => {
    const { error } = await supabase
        .from('CustomRequest')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};

/**
 * Get request statistics
 */
export const getStats = async (): Promise<RequestStats> => {
    const { data, error } = await supabase
        .from('CustomRequest')
        .select('status');

    if (error) throw error;

    const stats = (data || []).reduce(
        (acc: RequestStats, curr) => {
            acc.total++;
            const status = curr.status?.toLowerCase() || 'new';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((acc as any)[status] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (acc as any)[status]++;
            }
            return acc;
        },
        { total: 0, new: 0, quoted: 0, in_progress: 0, completed: 0 }
    );

    return stats;
};
