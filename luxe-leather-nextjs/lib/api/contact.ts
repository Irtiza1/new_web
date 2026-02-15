import { supabase, type ContactMessage } from '../supabase';

export type { ContactMessage };

// ============================================
// CONTACT MESSAGES CRUD
// ============================================

/**
 * Create a new contact message (from storefront form)
 */
export async function createContactMessage(
    message: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>
) {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert([{ ...message, status: 'new' }])
        .select()
        .single();

    if (error) throw error;
    return data as ContactMessage;
}

/**
 * Get all contact messages (admin)
 */
export async function getAllContactMessages() {
    const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as ContactMessage[];
}

/**
 * Update contact message status
 */
export async function updateContactMessageStatus(
    id: string,
    status: ContactMessage['status']
) {
    const { data, error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as ContactMessage;
}

/**
 * Delete contact message
 */
export async function deleteContactMessage(id: string) {
    const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}
