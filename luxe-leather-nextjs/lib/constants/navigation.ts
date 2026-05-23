
export const ADMIN_NAV_GROUPS = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
            { name: 'Analytics', path: '/admin/analytics', icon: 'bar_chart' },
        ]
    },
    {
        label: 'Commerce',
        items: [
            { name: 'Products', path: '/admin/products', icon: 'inventory_2' },
            { name: 'Orders', path: '/admin/orders', icon: 'shopping_bag' },
            { name: 'Coupons', path: '/admin/coupons', icon: 'local_offer' },
            { name: 'Categories', path: '/admin/categories', icon: 'category' },
        ]
    },
    {
        label: 'People',
        items: [
            { name: 'Customers', path: '/admin/customers', icon: 'group' },
            { name: 'Requests', path: '/admin/requests', icon: 'inbox' },
            { name: 'Reviews', path: '/admin/reviews', icon: 'star_rate' },
        ]
    },
    {
        label: 'Content',
        items: [
            { name: 'Homepage Builder', path: '/admin/homepage', icon: 'home_app_logo' },
            { name: 'Storefront CMS', path: '/admin/cms', icon: 'auto_stories' },
            { name: 'Navigation', path: '/admin/navigation', icon: 'menu' },
            { name: 'Media Library', path: '/admin/media', icon: 'photo_library' },
        ]
    },
    {
        label: 'System',
        items: [
            { name: 'Shipping & Sizing', path: '/admin/shipping-and-sizing', icon: 'local_shipping' },
            { name: 'Settings', path: '/admin/settings', icon: 'settings' },
        ]
    },
];

// Flat list for backward compatibility
export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap(g => g.items);

export const STOREFRONT_NAV_ITEMS = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Shipping', path: '/shipping' },
    { name: 'Our Story', path: '/our-story' },
    { name: 'Bespoke', path: '/bespoke' },
    { name: 'Contact', path: '/contact' },
];
