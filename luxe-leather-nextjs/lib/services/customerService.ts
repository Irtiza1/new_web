import { supabase, Customer } from '../../lib/supabase';
import { AppError } from '../utils/AppError';

// Type definition for enriched customer data
export interface CustomerWithStats extends Customer {
    ordersCount: number;
    totalSpent: number;
}

/**
 * Get all customers with optional filtering and pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated customers with stats
 */
export const getAll = async (query: { search?: string; page?: string; limit?: string }) => {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }

    const { data: customers, count, error } = await dbQuery;

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    // Fetch orders to calculate stats (optimally this should be a DB join or materialized view)
    // For now, we fetch orders for these specific customers
    // Since Supabase join syntax is specific, fetching related orders:
    // Actually, getting all orders is inefficient.
    // We'll fetch orders for the visible customers ONLY.
    const customerIds = customers?.map(c => c.id) || [];

    let ordersMap: Record<string, { count: number; total: number }> = {};

    if (customerIds.length > 0) {
        const { data: orders } = await supabase
            .from('orders')
            .select('customer_id, total')
            .in('customer_id', customerIds); // Only fetch for these customers!

        if (orders) {
            orders.forEach(order => {
                const cid = order.customer_id;
                if (!ordersMap[cid]) {
                    ordersMap[cid] = { count: 0, total: 0 };
                }
                ordersMap[cid].count++;
                ordersMap[cid].total += order.total;
            });
        }
    }

    const enrichedCustomers: CustomerWithStats[] = (customers || []).map(c => ({
        ...c,
        ordersCount: ordersMap[c.id]?.count || 0,
        totalSpent: ordersMap[c.id]?.total || 0,
    }));

    return {
        data: enrichedCustomers,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    };
};

/**
 * Get a customer by ID with stats
 * @param {string} id - Customer UUID
 * @returns {Promise<CustomerWithStats>}
 */
export const getById = async (id: string) => {
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !customer) {
        throw new AppError('Customer not found', 404, 'NOT_FOUND');
    }

    // Fetch stats
    const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('customer_id', id);

    const stats = orders?.reduce<{ count: number; total: number }>((acc, order) => ({
        count: acc.count + 1,
        total: acc.total + (order.total || 0)
    }), { count: 0, total: 0 }) || { count: 0, total: 0 };

    return {
        ...customer,
        ordersCount: stats.count,
        totalSpent: stats.total
    };
};

/**
 * Update a customer
 * @param {string} id - Customer UUID
 * @param {Partial<Customer>} data - Update data
 * @returns {Promise<Customer>}
 */
export const update = async (id: string, data: Partial<Customer>) => {
    const { data: updated, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return updated;
};

/**
 * Create a new customer
 * @param {Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>} data
 * @returns {Promise<Customer>}
 */
export const create = async (data: any) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('customers')
        .insert([{ ...data, id, createdAt: now, updatedAt: now }])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
    return created;
};

/**
 * Get a customer by Email
 * @param {string} email
 * @returns {Promise<Customer | null>}
 */
export const getByEmail = async (email: string) => {
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        return null;
    }
    return customer as Customer;
};

/**
 * Delete a customer by ID
 * ... (existing remove)
 */
export const remove = async (id: string) => {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }
};
