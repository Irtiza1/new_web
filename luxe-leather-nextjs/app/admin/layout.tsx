import { AdminNotificationProvider } from '@/contexts/AdminNotificationContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminNotificationProvider>
            <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8] dark:bg-[#101922]">
                <AdminSidebar />
                {children}
            </div>
        </AdminNotificationProvider>
    );
}
