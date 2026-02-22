import { supabase, type ContactMessage } from '@/lib/supabase';

export type { ContactMessage };

/**
 * Get all contact messages with optional filtering
 */
export const getAll = async (query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}) => {
    let dbQuery = supabase
        .from('contact_messages')
        .select('*', { count: 'exact' });

    // Apply filters
    if (query.status && query.status !== 'all') {
        dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,subject.ilike.%${query.search}%`);
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
        data: data as ContactMessage[],
        pagination: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        },
    };
};

/**
 * Get message by ID
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as ContactMessage;
};

/**
 * Create new message
 */
export const create = async (message: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert([{ ...message, status: 'new' }])
        .select()
        .single();

    if (error) throw error;
    return data as ContactMessage;
};

/**
 * Update message status
 */
export const updateStatus = async (id: string, status: ContactMessage['status']) => {
    const { data, error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as ContactMessage;
};

/**
 * Delete message
 */
export const remove = async (id: string) => {
    const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};
