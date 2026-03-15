import { supabase } from '@/lib/supabase';

// ============================================
// ANALYTICS SERVICE
// ============================================

export interface AnalyticsSummary {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalReturns: number;
    byStatus: Record<string, number>;
}

/**
 * Get aggregated analytics summary from orders table
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('total, status');

    if (error) throw error;

    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
    const totalOrders = orders?.length ?? 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const byStatus: Record<string, number> = {};
    orders?.forEach((o) => {
        const status = o.status || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const totalReturns = byStatus['CANCELLED'] ?? 0;

    return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalReturns,
        byStatus,
    };
}

export interface TopProduct {
    name: string;
    sales: number;
    percentage: number;
}

/**
 * Get top selling products based on order items
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    // 1. Get all order items directly
    const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id, quantity');

    if (error) throw error;

    if (!orderItems || orderItems.length === 0) return [];

    // 2. Aggregate sales by productId
    const salesMap: Record<string, number> = {};
    let totalSalesCount = 0;

    orderItems.forEach(item => {
        if (item.product_id) {
            const qty = Number(item.quantity) || 0;
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + qty;
            totalSalesCount += qty;
        }
    });

    // 3. Sort by sales count
    const sortedProducts = Object.entries(salesMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

    if (sortedProducts.length === 0) return [];

    // 4. Fetch product names
    const productIds = sortedProducts.map(([id]) => id);
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

    const nameMap = (products || []).reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
    }, {} as Record<string, string>);

    // 5. Format result
    return sortedProducts.map(([id, sales]) => ({
        name: nameMap[id] || 'Unknown Product',
        sales,
        percentage: totalSalesCount > 0 ? Math.round((sales / totalSalesCount) * 100) : 0
    }));
}

export interface CustomerCountry {
    country: string;
    count: number;
    percentage: number;
    flag: string;
}

const FLAG_MAP: Record<string, string> = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Pakistan': '🇵🇰',
};

/**
 * Get customers grouped by country
 */
export async function getCustomersByCountry(): Promise<CustomerCountry[]> {
    const { data: customers, error } = await supabase
        .from('customers')
        .select('country');

    if (error) throw error;

    if (!customers || customers.length === 0) return [];

    const countryMap: Record<string, number> = {};
    customers.forEach((c) => {
        const country = c.country || 'Unknown';
        countryMap[country] = (countryMap[country] || 0) + 1;
    });

    const total = customers.length;
    return Object.entries(countryMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => ({
            country,
            count,
            percentage: Math.round((count / total) * 100),
            flag: FLAG_MAP[country] || '🌍',
        }));
}
