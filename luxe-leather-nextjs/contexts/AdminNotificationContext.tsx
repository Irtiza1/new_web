'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

    const refreshCounts = async () => {
        try {
            // New Requests
            const { count: requestsCount } = await supabase
                .from('CustomRequest')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            // Pending Orders
            const { count: ordersCount } = await supabase
                .from('Order')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Low Stock Products
            const { count: stockCount } = await supabase
                .from('Product')
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
    };

    useEffect(() => {
        refreshCounts();

        // Poll every 60 seconds
        const interval = setInterval(refreshCounts, 60000);
        return () => clearInterval(interval);
    }, []);

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
