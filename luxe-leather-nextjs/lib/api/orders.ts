import { supabase, type Order } from '../supabase';

// ============================================
// ORDERS CRUD
// ============================================

/**
 * Get all orders
 */
export async function getAllOrders() {
    const { data, error } = await supabase
        .from('Order')
        .select('*, Customer(name, email)')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get orders by customer ID
 */
export async function getOrdersByCustomer(customerId: string) {
    const { data, error } = await supabase
        .from('Order')
        .select('*')
        .eq('customerId', customerId)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Order[];
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: Order['status']) {
    const { data, error } = await supabase
        .from('Order')
        .select('*, Customer(name, email)')
        .eq('status', status)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Get single order by ID
 */
export async function getOrderById(id: string) {
    const { data, error } = await supabase
        .from('Order')
        .select('*, Customer(name, email, phone)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Create new order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
        .from('Order')
        .insert([order])
        .select()
        .single();

    if (error) throw error;
    return data as Order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, status: Order['status']) {
    const { data, error } = await supabase
        .from('Order')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Order;
}

/**
 * Update order
 */
export async function updateOrder(id: string, updates: Partial<Order>) {
    const { data, error } = await supabase
        .from('Order')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Order;
}

/**
 * Delete order
 */
export async function deleteOrder(id: string) {
    const { error } = await supabase
        .from('Order')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
}

/**
 * Get order statistics
 */
export async function getOrderStats() {
    // Get total revenue
    const { data: totalRevenue, error: revenueError } = await supabase
        .from('Order')
        .select('total');

    if (revenueError) throw revenueError;

    // Get order counts by status
    const { data: statusCounts, error: statusError } = await supabase
        .from('Order')
        .select('status');

    if (statusError) throw statusError;

    const revenue = totalRevenue?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    const byStatus = statusCounts?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        totalRevenue: revenue,
        totalOrders: totalRevenue?.length || 0,
        byStatus,
    };
}
