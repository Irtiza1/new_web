import { supabase, Order } from '../../lib/supabase';
import { AppError } from '../utils/AppError';

// ============================================
// ORDER SERVICE
// ============================================

/**
 * Get all orders with optional filtering
 * @param {Object} query - Query parameters
 * @returns {Promise<Order[]>} List of orders
 */
export const getAll = async (query: { search?: string; status?: string; limit?: string }) => {
    let dbQuery = supabase
        .from('orders')
        .select('*, customers(name, email), order_items(*)')
        .order('createdAt', { ascending: false });

    if (query.status && query.status !== 'all') {
        dbQuery = dbQuery.eq('status', query.status);
    }

    // Note: Search filters on related Customer fields or Order ID
    // Supabase simplified searching might be tricky with relations in one go without RPC or specific handling.
    // For now, we'll fetch and let the frontend filter, OR strict match on ID, 
    // OR we can implement a more complex search if needed. 
    // Given the current usage in page.tsx client-side filtering, returning the list is key.
    // However, for efficiency, if search is provided, we might want to defer to client or solve it here.
    // For this refactor, I will implement a basic ID search if provided, but relying on client-side full text search 
    // for customer name/email is what the previous implementation essentially did by fetching all.
    // I will return the data and let the controller/frontend handle the specific fuzzy logic if it's too complex for basic PostgREST.

    // Actually, looking at the previous page.tsx, it fetches ALL and filters in JS.
    // To match performance, we should ideally filter DB side. 
    // Filtering nested relations (Customer.name) in Supabase is hard with simple query.
    // I will stick to returning the list based on status, and let the frontend refine, or implemented specific ID match.

    if (query.search) {
        dbQuery = dbQuery.ilike('id', `%${query.search}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return data;
};

/**
 * Get order by ID
 * @param {string} id - Order UUID
 * @returns {Promise<Order>}
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, email, phone), order_items(*, products(name, price))')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
    }
    return data;
};

/**
 * Create a new order
 * @param {any} orderData
 * @returns {Promise<Order>}
 */
export const create = async (orderData: any) => {
    const { items, ...orderPayload } = orderData;
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert the main Order record
    const { data, error } = await supabase
        .from('orders')
        .insert([{ ...orderPayload, id: orderId, items: JSON.stringify(items), createdAt: now, updatedAt: now, subtotal: orderPayload.total ?? 0, shipping: orderPayload.shipping ?? 0, customer_id: orderPayload.customer_id || orderPayload.customerId }])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // orderId already declared above; data.id will match it

    // Insert the associated OrderItems if provided (non-fatal — order data is in JSONB items column)
    if (items && Array.isArray(items) && items.length > 0) {
        try {
            const orderItems = items.map((item: any) => ({
                id: crypto.randomUUID(),
                order_id: orderId,
                product_id: item.product_id || item.productId,
                quantity: item.quantity,
                price: item.price,
            }));

            await supabase.from('order_items').insert(orderItems);
        } catch (e) {
            console.warn('order_items insert failed (non-fatal):', e);
        }
    }

    return data as Order;
};

/**
 * Update a order
 * @param {string} id - Order UUID
 * @param {Partial<Order>} updates
 * @returns {Promise<Order>}
 */
export const update = async (id: string, updates: Partial<Order>) => {
    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return data as Order;
};

/**
 * Delete a order
 * @param {string} id - Order UUID
 * @returns {Promise<void>}
 */
export const remove = async (id: string) => {
    // Delete associated OrderItems first
    const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

    if (itemsError) {
        throw new AppError(itemsError.message, 500, 'DB_ERROR');
    }

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
};

/**
 * Get order statistics
 */
export const getStats = async () => {
    // Get total revenue
    const { data: totalRevenue, error: revenueError } = await supabase
        .from('orders')
        .select('total');

    if (revenueError) throw new AppError(revenueError.message, 500, 'DB_ERROR');

    // Get order counts by status
    const { data: statusCounts, error: statusError } = await supabase
        .from('orders')
        .select('status');

    if (statusError) throw new AppError(statusError.message, 500, 'DB_ERROR');

    const revenue = totalRevenue?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    const byStatus = statusCounts?.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        totalRevenue: revenue,
        totalOrders: totalRevenue?.length || 0,
        byStatus,
    };
};
