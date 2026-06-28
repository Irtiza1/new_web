import { NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, getAuthUser } from '@/lib/auth/server';
import { hasAnyPermission, hasPermission, type Permission } from '@/lib/auth/rbac';

type RoutePolicy =
    | { access: 'public' }
    | { access: 'authenticated'; permissions?: Permission[] };

const PUBLIC_FILE = /\.(.*)$/;

function isPublicApiRoute(req: NextRequest): boolean {
    const { pathname, searchParams } = req.nextUrl;
    const method = req.method.toUpperCase();

    if (pathname === '/api/webhooks/stripe' && method === 'POST') return true;
    if (pathname === '/api/checkout/payment-intent' && method === 'POST') return true;
    if (pathname === '/api/contact' && method === 'POST') return true;
    if (pathname === '/api/requests' && method === 'POST') return true;
    if (pathname === '/api/media' && method === 'POST') return true;
    if (pathname === '/api/analytics/track' && method === 'POST') return true;
    if (pathname === '/api/coupons' && method === 'GET') return true;
    if (pathname === '/api/products/validate' && method === 'GET') return true;
    if (pathname === '/api/products/validate-stock' && method === 'POST') return true;

    if (
        method === 'GET'
        && [
            '/api/categories',
            '/api/nav-items',
            '/api/reviews',
            '/api/settings',
            '/api/shipping-zones',
            '/api/size-guides',
        ].includes(pathname)
    ) {
        return true;
    }

    if (method === 'GET' && pathname === '/api/products') {
        return searchParams.get('includeInactive') !== 'true';
    }

    if (method === 'GET' && /^\/api\/products\/[^/]+$/.test(pathname)) {
        return true;
    }

    return false;
}

function getApiPermissions(pathname: string, method: string): Permission[] {
    if (pathname.startsWith('/api/analytics')) return ['analytics:read'];
    if (pathname.startsWith('/api/audit-logs')) return ['audit:read'];
    if (pathname.startsWith('/api/customers')) {
        return method === 'GET' ? ['customers:read'] : ['customers:write'];
    }
    if (pathname.startsWith('/api/orders')) {
        return method === 'GET' ? ['orders:read'] : ['orders:write'];
    }
    if (pathname.startsWith('/api/requests')) {
        return method === 'GET' ? ['requests:read'] : ['requests:write'];
    }
    if (pathname.startsWith('/api/contact')) {
        return method === 'GET' ? ['requests:read'] : ['requests:write'];
    }
    if (
        pathname.startsWith('/api/products')
        || pathname.startsWith('/api/categories')
        || pathname.startsWith('/api/coupons/admin')
        || pathname.startsWith('/api/reviews')
        || pathname.startsWith('/api/shipping-zones')
        || pathname.startsWith('/api/size-guides')
    ) {
        return ['catalog:write'];
    }
    if (
        pathname.startsWith('/api/settings')
        || pathname.startsWith('/api/nav-items')
    ) {
        return ['settings:write'];
    }
    if (pathname.startsWith('/api/media')) return ['media:write'];
    if (pathname.startsWith('/api/migrate')) return ['settings:write'];

    return ['admin:access'];
}

function getRoutePolicy(req: NextRequest): RoutePolicy {
    const { pathname } = req.nextUrl;
    const method = req.method.toUpperCase();

    if (
        pathname.startsWith('/_next')
        || pathname.startsWith('/favicon')
        || PUBLIC_FILE.test(pathname)
    ) {
        return { access: 'public' };
    }

    if (pathname.startsWith('/admin')) {
        return { access: 'authenticated', permissions: ['admin:access'] };
    }

    if (pathname.startsWith('/api')) {
        if (isPublicApiRoute(req)) {
            return { access: 'public' };
        }

        if (pathname.startsWith('/api/account')) {
            return { access: 'authenticated' };
        }

        return {
            access: 'authenticated',
            permissions: getApiPermissions(pathname, method),
        };
    }

    return { access: 'public' };
}

export async function proxy(req: NextRequest) {
    const policy = getRoutePolicy(req);

    if (policy.access === 'public') {
        return NextResponse.next();
    }

    const user = await getAuthUser(req);
    if (!user || typeof user === 'string') {
        const errorReason = typeof user === 'string' ? user : 'unknown_error';
        console.error('proxy.ts: Authentication failed. Redirecting to login. Reason:', errorReason);
        if (req.nextUrl.pathname.startsWith('/admin')) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = '/login';
            loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname + req.nextUrl.search);
            loginUrl.searchParams.set('authError', errorReason);
            return NextResponse.redirect(loginUrl);
        }

        return authErrorResponse(401);
    }

    const permissions = policy.permissions ?? [];
    const allowed = permissions.length === 0
        || permissions.some((permission) => hasPermission(user, permission))
        || hasAnyPermission(user, ['settings:write']);

    if (!allowed) {
        return authErrorResponse(403);
    }

    const res = NextResponse.next();
    res.headers.set('x-auth-user-id', user.id);
    res.headers.set('x-auth-role', user.role);
    return res;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*',
    ],
};
