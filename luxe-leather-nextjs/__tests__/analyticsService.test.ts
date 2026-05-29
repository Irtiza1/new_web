import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as analyticsService from '@/lib/services/analyticsService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => {
    const mockSelect = vi.fn();
    const mockGte = vi.fn();
    const mockLte = vi.fn();
    
    const mockFrom = vi.fn(() => ({
        select: mockSelect,
    }));

    mockSelect.mockReturnValue({ gte: mockGte });
    mockGte.mockReturnValue({ lte: mockLte });

    return {
        supabase: {
            from: mockFrom,
        },
        supabaseAdmin: {},
    };
});

describe('analyticsService - getTrafficSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should correctly aggregate real database rows dynamically', async () => {
        const mockRows = [
            {
                id: '1',
                event_type: 'page_view',
                path: '/',
                session_id: 'sess-1',
                country: 'United States',
                region: 'California',
                city: 'San Francisco',
                device_type: 'Desktop',
                os: 'Mac',
                browser: 'Chrome',
                created_at: '2026-05-29T10:30:00Z',
            },
            {
                id: '2',
                event_type: 'page_view',
                path: '/shop',
                session_id: 'sess-1',
                country: 'United States',
                region: 'California',
                city: 'San Francisco',
                device_type: 'Desktop',
                os: 'Mac',
                browser: 'Chrome',
                created_at: '2026-05-29T10:32:00Z',
            },
            {
                id: '3',
                event_type: 'add_to_cart',
                path: '/shop',
                session_id: 'sess-2',
                country: 'Canada',
                region: 'Ontario',
                city: 'Toronto',
                device_type: 'Mobile',
                os: 'iOS',
                browser: 'Safari',
                created_at: '2026-05-29T14:15:00Z',
            },
            {
                id: '4',
                event_type: 'search',
                path: '/shop?search=wallet',
                session_id: 'sess-2',
                country: 'Canada',
                region: 'Ontario',
                city: 'Toronto',
                device_type: 'Mobile',
                os: 'iOS',
                browser: 'Safari',
                metadata: { query: 'wallet' },
                created_at: '2026-05-29T14:16:00Z',
            },
        ];

        // Setup mock return from Supabase
        const mockLte = vi.fn().mockResolvedValue({
            data: mockRows,
            error: null,
        });
        const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
        const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
        
        (supabase.from as any).mockReturnValue({
            select: mockSelect,
        });

        const stats = await analyticsService.getTrafficSummary('2026-05-29', '2026-05-29');

        // 1. Basic Counts
        expect(stats.pageViews).toBe(4);
        expect(stats.uniqueSessions).toBe(2);

        // 2. Temporal Aggregation (hourly, daily, monthly in UTC)
        // 10:30, 10:32 UTC (Hour 10) -> 2 views
        // 14:15, 14:16 UTC (Hour 14) -> 2 views
        expect(stats.hourlyViews[10]).toBe(2);
        expect(stats.hourlyViews[14]).toBe(2);
        
        // 2026-05-29 is a Friday (UTCDay 5) -> 4 views
        expect(stats.dailyViews[5]).toBe(4);

        // Month 5 (May) -> 4 views
        expect(stats.monthlyViews[5]).toBe(4);

        // 3. Geographic Profiles (Top countries, regions, cities sorted by count)
        expect(stats.countries[0]).toEqual({ name: 'United States', count: 2, percentage: 50 });
        expect(stats.countries[1]).toEqual({ name: 'Canada', count: 2, percentage: 50 });

        expect(stats.regions[0]).toEqual({ name: 'California', count: 2, percentage: 50 });
        expect(stats.regions[1]).toEqual({ name: 'Ontario', count: 2, percentage: 50 });

        expect(stats.cities[0]).toEqual({ name: 'San Francisco', count: 2, percentage: 50 });
        expect(stats.cities[1]).toEqual({ name: 'Toronto', count: 2, percentage: 50 });

        // 4. Device and User Agent stats
        expect(stats.deviceType.Desktop).toBe(2);
        expect(stats.deviceType.Mobile).toBe(2);
        expect(stats.os.Mac).toBe(2);
        expect(stats.os.iOS).toBe(2);
        expect(stats.browser.Chrome).toBe(2);
        expect(stats.browser.Safari).toBe(2);

        // 5. Custom Event Funnels & Searches
        expect(stats.events.page_view).toBe(2);
        expect(stats.events.add_to_cart).toBe(1);
        expect(stats.events.search).toBe(1);

        expect(stats.topSearches[0]).toEqual({ query: 'wallet', count: 1 });
    });

    it('should return fallback empty stats gracefully when database table is not found (migration not run)', async () => {
        // Setup mock error response from Supabase (42P01 is pg table-not-found code)
        const mockLte = vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42P01', message: 'relation "traffic_events" does not exist' },
        });
        const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
        const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
        
        (supabase.from as any).mockReturnValue({
            select: mockSelect,
        });

        const stats = await analyticsService.getTrafficSummary('2026-05-29', '2026-05-29');

        expect(stats.pageViews).toBe(0);
        expect(stats.uniqueSessions).toBe(0);
        expect(stats.countries).toEqual([]);
        expect(stats.regions).toEqual([]);
        expect(stats.cities).toEqual([]);
    });
});
