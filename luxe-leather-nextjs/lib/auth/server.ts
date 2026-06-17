import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { isRole, permissionsForRole, type AuthUser, type Permission, type Role } from './rbac';

type SupabaseAuthCookie = {
    access_token?: string;
    user?: {
        id?: string;
        email?: string;
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
    };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAuthClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

function decodeCookieValue(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function parseAuthCookie(value: string): SupabaseAuthCookie | null {
    const decoded = decodeCookieValue(value);
    const normalized = decoded.startsWith('base64-')
        ? atob(decoded.replace('base64-', ''))
        : decoded;

    try {
        const parsed = JSON.parse(normalized);
        return Array.isArray(parsed)
            ? { access_token: parsed[0] }
            : parsed;
    } catch {
        return null;
    }
}

export function getAccessTokenFromRequest(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice('bearer '.length).trim();
    }

    const explicitToken = req.cookies.get('sb-access-token')?.value;
    if (explicitToken) {
        try {
            return decodeURIComponent(explicitToken);
        } catch {
            return explicitToken;
        }
    }

    for (const cookie of req.cookies.getAll()) {
        if (!cookie.name.startsWith('sb-') || !cookie.name.endsWith('-auth-token')) {
            continue;
        }

        const parsed = parseAuthCookie(cookie.value);
        if (parsed?.access_token) {
            return parsed.access_token;
        }
    }

    return null;
}

function roleFromUserMetadata(user: User): Role {
    const appRole = user.app_metadata?.role;
    const metadataRole = user.user_metadata?.role;

    if (isRole(appRole)) return appRole;
    if (isRole(metadataRole)) return metadataRole;

    return 'customer';
}

async function roleFromDatabase(userId: string): Promise<Role | null> {
    const client = createAuthClient();
    if (!client) return null;

    const { data, error } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data || !isRole(data.role)) {
        return null;
    }

    return data.role;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | string | null> {
    const token = getAccessTokenFromRequest(req);
    if (!token) {
        console.error('getAuthUser: No token found in request');
        return 'no_token_found';
    }

    const client = createAuthClient();
    if (!client) {
        console.error('getAuthUser: Failed to create Auth Client (Missing env vars?)');
        return 'missing_env_vars';
    }

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
        console.error('getAuthUser: Supabase getUser failed', error?.message || 'No user returned');
        return `supabase_error_${error?.message || 'no_user'}`;
    }

    const role = (await roleFromDatabase(data.user.id)) ?? roleFromUserMetadata(data.user);

    return {
        id: data.user.id,
        email: data.user.email,
        role,
        permissions: permissionsForRole(role),
    };
}

export async function requirePermission(req: NextRequest, permission: Permission): Promise<AuthUser> {
    const user = await getAuthUser(req);
    if (!user) {
        throw new Response('Unauthorized', { status: 401 });
    }

    if (!user.permissions.includes(permission)) {
        throw new Response('Forbidden', { status: 403 });
    }

    return user;
}

export function authErrorResponse(status: 401 | 403, message?: string): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: message ?? (status === 401 ? 'Unauthorized' : 'Forbidden'),
        },
        { status }
    );
}
