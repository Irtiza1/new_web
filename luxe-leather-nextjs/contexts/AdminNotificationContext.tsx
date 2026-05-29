'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface NotificationCounts {
    newRequests: number;
    pendingOrders: number;
    lowStock: number;
}

interface AdminNotificationContextType {
    counts: NotificationCounts;
    refreshCounts: () => Promise<void>;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
    const [counts, setCounts] = useState<NotificationCounts>({
        newRequests: 0,
        pendingOrders: 0,
        lowStock: 0,
    });

    const refreshCounts = useCallback(async () => {
        try {
            // New Requests
            const { count: requestsCount } = await supabase
                .from('custom_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'NEW');

            // Pending Orders
            const { count: ordersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');

            // Low Stock Products
            const { count: stockCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lt('stock', 5);

            setCounts({
                newRequests: requestsCount || 0,
                pendingOrders: ordersCount || 0,
                lowStock: stockCount || 0,
            });
        } catch (error) {
            console.error('Failed to fetch notification counts', error);
        }
    }, []);

    useEffect(() => {
        const initialTimer = window.setTimeout(() => {
            void refreshCounts();
        }, 0);

        // Poll every 60 seconds
        const interval = setInterval(refreshCounts, 60000);
        return () => {
            window.clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [refreshCounts]);

    return (
        <AdminNotificationContext.Provider value={{ counts, refreshCounts }}>
            {children}
        </AdminNotificationContext.Provider>
    );
}

export function useAdminNotifications() {
    const context = useContext(AdminNotificationContext);
    if (context === undefined) {
        throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
    }
    return context;
}
