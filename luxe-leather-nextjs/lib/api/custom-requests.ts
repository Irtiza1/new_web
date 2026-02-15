import { supabase, type CustomRequest } from '../supabase';
export type { CustomRequest };

// ============================================
// CUSTOM REQUESTS CRUD
// ============================================

/**
 * Get all custom requests
 */
export async function getAllCustomRequests() {
    const { data, error } = await supabase
        .from('CustomRequest')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as CustomRequest[];
}

/**
 * Get custom requests by status
 */
export async function getCustomRequestsByStatus(status: CustomRequest['status']) {
    const { data, error } = await supabase
        .from('CustomRequest')
        .select('*')
        .eq('status', status)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as CustomRequest[];
}

/**
 * Get single custom request by ID
 */
export async function getCustomRequestById(id: string) {
    const { data, error } = await supabase
        .from('CustomRequest')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as CustomRequest;
}

/**
 * Create new custom request
 */
export async function createCustomRequest(
    request: Omit<CustomRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
) {
    const { data, error } = await supabase
        .from('CustomRequest')
        .insert([{ ...request, status: 'new' }])
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
}

/**
 * Update custom request status
 */
export async function updateCustomRequestStatus(
    id: string,
    status: CustomRequest['status']
) {
    const { data, error } = await supabase
        .from('CustomRequest')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
}

/**
 * Update custom request
 */
export async function updateCustomRequest(
    id: string,
    updates: Partial<CustomRequest>
) {
    const { data, error } = await supabase
        .from('CustomRequest')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CustomRequest;
}

/**
 * Delete custom request
 */
export async function deleteCustomRequest(id: string) {
    const { error } = await supabase
        .from('CustomRequest')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}
