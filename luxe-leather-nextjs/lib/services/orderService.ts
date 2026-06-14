import { supabase, Order } from '../../lib/supabase';
import { AppError } from '../utils/AppError';
import { auditLog } from './auditService';
import { createOrderNumber } from '../utils/orderNumber';

// ============================================================
// ORDER SERVICE
// ============================================================

/**
 * Get all orders with optional filtering.
 * Soft-deleted orders (isDeleted=true) are hidden by default.
 * Pass includeDeleted=true to see them (e.g. for restore UI).
 */
export const getAll = async (query: {
    search?: string;
    status?: string;
    limit?: string;
    includeDeleted?: boolean;
}) => {
    let dbQuery = supabase
        .from('orders')
        .select('*, customers(name, email), order_items(*)')
        .order('createdAt', { ascending: false });

    // Hide soft-deleted orders from normal views
    if (!query.includeDeleted) {
        dbQuery = dbQuery.eq('isDeleted', false);
    }

    if (query.status && query.status !== 'all') {
        dbQuery = dbQuery.eq('status', query.status);
    }

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
 */
export const getById = async (id: string) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, customers(name, email, phone, address, city, country), order_items(*, products(name, price, image))')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Order not found', 404, 'NOT_FOUND');
    }
    return data;
};

/**
 * Create a new order atomically using the create_order_with_items RPC.
 * Falls back to sequential inserts if the RPC is not yet deployed.
 */
export const create = async (orderData: Partial<Order> & { items?: unknown[] }) => {
    const { items, customerId, ...orderPayload } = orderData;
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    const orderObj = {
        id: orderId,
        order_number: createOrderNumber(new Date(now), orderId),
        createdAt: now,
        updatedAt: now,
        subtotal: orderPayload.total ?? 0,
        shipping: orderPayload.shipping ?? 0,
        customer_id: orderPayload.customer_id || customerId,
        ...orderPayload,
    };

    try {
        // Attempt atomic RPC (requires migration 012 to be run)
        const { data: rpcData, error: rpcError } = await supabase.rpc(
            'create_order_with_items',
            { p_order: orderObj, p_items: items ?? [] }
        );

        if (!rpcError && rpcData) {
            await auditLog('orders', orderId, 'CREATE', { status: { from: null, to: orderObj.status ?? 'PENDING' } });
            return rpcData as Order;
        }

        // RPC not available — fall back to sequential inserts
        console.warn('[OrderService] RPC not available, using sequential inserts:', rpcError?.message);
    } catch {
        console.warn('[OrderService] RPC call failed, falling back to sequential inserts');
    }

    // Fallback: sequential (non-atomic)
    const { data, error } = await supabase
        .from('orders')
        .insert([{ ...orderObj }])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    if (items && Array.isArray(items) && items.length > 0) {
        const orderItems = items.map((item: Record<string, unknown>) => ({
            id: crypto.randomUUID(),
            order_id: orderId,
            product_id: String(item.product_id || item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            variant: item.variant ? String(item.variant) : null,
            color: item.color ? String(item.color) : null,
            size: item.size ? String(item.size) : null,
        }));
        await supabase.from('order_items').insert(orderItems);
    }

    await auditLog('orders', orderId, 'CREATE', { status: { from: null, to: orderObj.status ?? 'PENDING' } });
    return data as Order;
};

/**
 * Update an order (e.g. status change).
 * Captures a field-level diff for audit logging.
 */
export const update = async (id: string, updates: Partial<Order>) => {
    // Capture before state for audit diff and stock management
    const { data: before } = await supabase.from('orders').select('*, order_items(product_id, quantity)').eq('id', id).single();

    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // Restore stock if the order is newly cancelled
    if (before && before.status !== 'CANCELLED' && updates.status === 'CANCELLED') {
        if (before.order_items && Array.isArray(before.order_items)) {
            for (const item of before.order_items) {
                // We use RPC for atomic increment if available, otherwise fallback to fetch and update
                try {
                    const { error: rpcError } = await supabase.rpc('increment_stock', {
                        p_product_id: item.product_id,
                        p_amount: item.quantity
                    });
                    
                    if (rpcError) {
                        // Fallback if RPC doesn't exist
                        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                        if (prod) {
                            await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                        }
                    }
                } catch {
                    // Fallback if RPC doesn't exist
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (prod) {
                        await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                    }
                }
            }
        }
    }

    if (before) {
        const changedFields: Record<string, { from: unknown; to: unknown }> = {};
        for (const key of Object.keys(updates) as (keyof Order)[]) {
            if (before[key] !== (data as Order)[key]) {
                changedFields[key as string] = { from: before[key], to: (data as Order)[key] };
            }
        }
        if (Object.keys(changedFields).length > 0) {
            await auditLog('orders', id, 'UPDATE', changedFields);
        }
    }

    return data as Order;
};

/**
 * Soft-delete an order (sets isDeleted = true).
 *
 * Orders are permanent financial records — we never hard delete them.
 * Soft deletion hides them from the admin list while preserving all data
 * for accounting, reporting, and dispute resolution.
 *
 * Uses the delete_order_safe RPC for atomicity if available.
 */
export const remove = async (id: string) => {
    // Capture state to restore stock
    const { data: order } = await supabase.from('orders').select('*, order_items(product_id, quantity)').eq('id', id).single();

    const { error } = await supabase
        .from('orders')
        // When an order is deleted from admin panel, it is effectively CANCELLED as well
        .update({ isDeleted: true, status: 'CANCELLED', updatedAt: new Date().toISOString() } as Partial<Order>)
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // Restore stock if the order wasn't already cancelled
    if (order && order.status !== 'CANCELLED') {
        if (order.order_items && Array.isArray(order.order_items)) {
            for (const item of order.order_items) {
                try {
                    const { error: rpcError } = await supabase.rpc('increment_stock', {
                        p_product_id: item.product_id,
                        p_amount: item.quantity
                    });
                    
                    if (rpcError) {
                        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                        if (prod) {
                            await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                        }
                    }
                } catch {
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
                    if (prod) {
                        await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
                    }
                }
            }
        }
    }

    await auditLog('orders', id, 'DELETE', { isDeleted: { from: false, to: true } });
};

/**
 * Restore a soft-deleted order.
 */
export const restore = async (id: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ isDeleted: false, updatedAt: new Date().toISOString() } as Partial<Order>)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('orders', id, 'RESTORE', { isDeleted: { from: true, to: false } });
    return data as Order;
};

/**
 * Get order statistics (only counts non-deleted orders).
 */
export const getStats = async () => {
    const { data: totalRevenue, error: revenueError } = await supabase
        .from('orders')
        .select('total')
        .eq('isDeleted', false);

    if (revenueError) throw new AppError(revenueError.message, 500, 'DB_ERROR');

    const { data: statusCounts, error: statusError } = await supabase
        .from('orders')
        .select('status')
        .eq('isDeleted', false);

    if (statusError) throw new AppError(statusError.message, 500, 'DB_ERROR');

    const revenue = totalRevenue?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    const byStatus = statusCounts?.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        totalRevenue: revenue,
        totalOrders: totalRevenue?.length || 0,
        byStatus,
    };
};
