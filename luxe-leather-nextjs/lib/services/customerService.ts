import { supabase, Customer } from '../../lib/supabase';
import { AppError } from '../utils/AppError';
import { auditLog } from './auditService';

// Type definition for enriched customer data
export interface CustomerWithStats extends Customer {
    ordersCount: number;
    totalSpent: number;
}

/**
 * Get all customers with optional filtering and pagination.
 * Anonymized/inactive customers (isActive=false) are hidden by default.
 */
export const getAll = async (query: {
    search?: string;
    page?: string;
    limit?: string;
    includeInactive?: boolean;
}) => {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

    if (!query.includeInactive) {
        dbQuery = dbQuery.eq('isActive', true);
    }

    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }

    const { data: customers, count, error } = await dbQuery;

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    const customerIds = customers?.map(c => c.id) || [];
    const ordersMap: Record<string, { count: number; total: number }> = {};

    if (customerIds.length > 0) {
        const { data: orders } = await supabase
            .from('orders')
            .select('customer_id, total')
            .in('customer_id', customerIds)
            .eq('isDeleted', false);

        if (orders) {
            orders.forEach(order => {
                const cid = order.customer_id;
                if (!ordersMap[cid]) ordersMap[cid] = { count: 0, total: 0 };
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

    const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('customer_id', id)
        .eq('isDeleted', false);

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
 */
export const update = async (id: string, data: Partial<Customer>) => {
    const { data: before } = await supabase.from('customers').select('*').eq('id', id).single();

    const { data: updated, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    if (before) {
        const changedFields: Record<string, { from: unknown; to: unknown }> = {};
        for (const key of Object.keys(data) as (keyof Customer)[]) {
            if (before[key] !== (updated as Customer)[key]) {
                changedFields[key as string] = { from: before[key], to: (updated as Customer)[key] };
            }
        }
        if (Object.keys(changedFields).length > 0) {
            await auditLog('customers', id, 'UPDATE', changedFields);
        }
    }

    return updated;
};

/**
 * Create a new customer
 * @param {Partial<Customer>} data - The customer payload
 * @returns {Promise<Customer>}
 */
export const create = async (data: Partial<Customer>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { data: created, error } = await supabase
        .from('customers')
        .insert([{ ...data, id, isActive: true, createdAt: now, updatedAt: now }])
        .select()
        .single();

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('customers', id, 'CREATE', { email: { from: null, to: data.email } });
    return created;
};

/**
 * Get a customer by Email
 */
export const getByEmail = async (email: string) => {
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();

    if (error) return null;
    return customer as Customer;
};

/**
 * Anonymize a customer (GDPR-compliant soft delete).
 *
 * Strategy:
 *   - Wipes all PII: name, email, phone, address, city, country
 *   - Sets isActive = false so they're hidden from admin lists
 *   - All orders are preserved with anonymized customer reference
 *   - Custom requests are unlinked (customerId = null) but kept
 *   - Uses anonymize_customer RPC for atomicity (migration 012 required)
 *
 * Why not hard delete?
 *   - Orders reference customer_id; hard delete would orphan them
 *   - Financial/audit records require the customer row to exist
 */
export const remove = async (id: string) => {
    // Try atomic RPC anonymization first
    try {
        const { error: rpcError } = await supabase.rpc('anonymize_customer', {
            p_customer_id: id,
        });

        if (!rpcError) {
            await auditLog('customers', id, 'ANONYMIZE', {
                isActive: { from: true, to: false },
                name: { from: '[original]', to: 'Deleted User' },
                email: { from: '[original]', to: `deleted+${id}@deleted.invalid` },
            });
            return;
        }
        console.warn('[CustomerService] RPC anonymize_customer not available, falling back:', rpcError.message);
    } catch {
        console.warn('[CustomerService] RPC call failed, using sequential fallback');
    }

    // Fallback: sequential anonymization
    await supabase
        .from('custom_requests')
        .update({ customerId: null })
        .eq('customerId', id);

    const { error } = await supabase
        .from('customers')
        .update({
            name: 'Deleted User',
            email: `deleted+${id}@deleted.invalid`,
            phone: null,
            address: null,
            city: null,
            country: null,
            isActive: false,
            updatedAt: new Date().toISOString(),
        } as Partial<Customer>)
        .eq('id', id);

    if (error) {
        throw new AppError(error.message, 500, 'DB_ERROR');
    }

    await auditLog('customers', id, 'ANONYMIZE', {
        isActive: { from: true, to: false },
        name: { from: '[original]', to: 'Deleted User' },
    });
};
