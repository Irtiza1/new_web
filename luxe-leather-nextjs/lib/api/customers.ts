import { supabase, type Customer } from '../supabase';

// ============================================
// CUSTOMERS CRUD
// ============================================

/**
 * Get all customers
 */
export async function getAllCustomers() {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Customer[];
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Customer;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

    if (error) throw error;
    return data as Customer;
}

/**
 * Search customers
 */
export async function searchCustomers(query: string) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Customer[];
}

/**
 * Create new customer
 */
export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

    if (error) throw error;
    return data as Customer;
}

/**
 * Update customer
 */
export async function updateCustomer(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Customer;
}

/**
 * Delete customer
 */
export async function deleteCustomer(id: string) {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}
