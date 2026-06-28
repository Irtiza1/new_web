import { supabaseAdmin } from '@/lib/supabase';

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
    const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('total, status')
        .eq('isDeleted', false);

    if (error) throw error;

    const totalRevenue = orders?.filter(o => o.status !== 'CANCELLED' && o.status !== 'REPLACED').reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
    const totalOrders = orders?.filter(o => o.status !== 'CANCELLED' && o.status !== 'REPLACED').length ?? 0;
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
    id: string;
    name: string;
    sales: number;
    percentage: number;
}

/**
 * Get top selling products based on order items
 */
export async function getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    // 1. Get all order items directly
    const { data: orderItems, error } = await supabaseAdmin
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
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .in('id', productIds);

    const nameMap = (products || []).reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
    }, {} as Record<string, string>);

    // 5. Format result
    return sortedProducts.map(([id, sales]) => ({
        id,
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
    const { data: customers, error } = await supabaseAdmin
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

export interface TrafficStats {
    pageViews: number;
    uniqueSessions: number;
    hourlyViews: Record<number, number>;
    dailyViews: Record<number, number>;
    monthlyViews: Record<number, number>;
    countries: Array<{ name: string; count: number; percentage: number }>;
    regions: Array<{ name: string; count: number; percentage: number }>;
    cities: Array<{ name: string; count: number; percentage: number }>;
    deviceType: Record<string, number>;
    os: Record<string, number>;
    browser: Record<string, number>;
    events: Record<string, number>;
    topPages: Array<{ path: string; count: number }>;
    topSearches: Array<{ query: string; count: number }>;
}

/**
 * Aggregate website visitor traffic events from traffic_events table
 */
export async function getTrafficSummary(startDate: string, endDate: string): Promise<TrafficStats> {
    const { data: events, error } = await supabaseAdmin
        .from('traffic_events')
        .select('*')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z');

    if (error) {
        // Return empty fallback stats if table does not exist yet (before migration runs)
        if (error.code === '42P01') {
            return getFallbackTrafficStats();
        }
        throw error;
    }

    const pageViews = events?.length ?? 0;
    const sessionSet = new Set(events?.map(e => e.session_id) || []);
    const uniqueSessions = sessionSet.size;

    // Time buckets
    const hourlyViews: Record<number, number> = {};
    const dailyViews: Record<number, number> = {};
    const monthlyViews: Record<number, number> = {};
    
    // Geo buckets
    const countryCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};

    // Device buckets
    const deviceTypeCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};

    // Events counts
    const eventCounts: Record<string, number> = {};
    
    // Path counts
    const pathCounts: Record<string, number> = {};
    
    // Search queries
    const searchCounts: Record<string, number> = {};

    (events || []).forEach(e => {
        const dt = new Date(e.created_at);
        
        // Time
        const hour = dt.getUTCHours();
        const day = dt.getUTCDay(); // 0 is Sunday, 6 is Saturday
        const month = dt.getUTCMonth() + 1; // 1-12
        hourlyViews[hour] = (hourlyViews[hour] || 0) + 1;
        dailyViews[day] = (dailyViews[day] || 0) + 1;
        monthlyViews[month] = (monthlyViews[month] || 0) + 1;

        // Geo
        const country = e.country || 'Unknown';
        const region = e.region || 'Unknown';
        const city = e.city || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
        regionCounts[region] = (regionCounts[region] || 0) + 1;
        cityCounts[city] = (cityCounts[city] || 0) + 1;

        // Device
        const device = e.device_type || 'Desktop';
        const osName = e.os || 'Unknown';
        const browserName = e.browser || 'Unknown';
        deviceTypeCounts[device] = (deviceTypeCounts[device] || 0) + 1;
        osCounts[osName] = (osCounts[osName] || 0) + 1;
        browserCounts[browserName] = (browserCounts[browserName] || 0) + 1;

        // Event type
        const type = e.event_type || 'page_view';
        eventCounts[type] = (eventCounts[type] || 0) + 1;

        // Path
        pathCounts[e.path] = (pathCounts[e.path] || 0) + 1;

        // Search metadata
        if (type === 'search' && e.metadata?.query) {
            const q = e.metadata.query.trim().toLowerCase();
            if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
        }
    });

    // Format Geo arrays
    const formatCounts = (counts: Record<string, number>, total: number) => {
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }));
    };

    const topPages = Object.entries(pathCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([path, count]) => ({ path, count }));

    const topSearches = Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([query, count]) => ({ query, count }));

    return {
        pageViews,
        uniqueSessions,
        hourlyViews,
        dailyViews,
        monthlyViews,
        countries: formatCounts(countryCounts, pageViews),
        regions: formatCounts(regionCounts, pageViews),
        cities: formatCounts(cityCounts, pageViews),
        deviceType: deviceTypeCounts,
        os: osCounts,
        browser: browserCounts,
        events: eventCounts,
        topPages,
        topSearches
    };
}

function getFallbackTrafficStats(): TrafficStats {
    return {
        pageViews: 0,
        uniqueSessions: 0,
        hourlyViews: {},
        dailyViews: {},
        monthlyViews: {},
        countries: [],
        regions: [],
        cities: [],
        deviceType: {},
        os: {},
        browser: {},
        events: {},
        topPages: [],
        topSearches: []
    };
}
