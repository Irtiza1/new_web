export const ROLES = ['customer', 'support', 'manager', 'admin', 'super_admin'] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
    | 'admin:access'
    | 'analytics:read'
    | 'audit:read'
    | 'catalog:write'
    | 'cms:write'
    | 'customers:read'
    | 'customers:write'
    | 'media:write'
    | 'orders:read'
    | 'orders:write'
    | 'requests:read'
    | 'requests:write'
    | 'settings:write';

export type AuthUser = {
    id: string;
    email?: string;
    role: Role;
    permissions: Permission[];
};

const rolePermissions: Record<Role, Permission[]> = {
    customer: [],
    support: [
        'admin:access',
        'customers:read',
        'orders:read',
        'requests:read',
        'requests:write',
    ],
    manager: [
        'admin:access',
        'analytics:read',
        'catalog:write',
        'cms:write',
        'customers:read',
        'customers:write',
        'media:write',
        'orders:read',
        'orders:write',
        'requests:read',
        'requests:write',
    ],
    admin: [
        'admin:access',
        'analytics:read',
        'audit:read',
        'catalog:write',
        'cms:write',
        'customers:read',
        'customers:write',
        'media:write',
        'orders:read',
        'orders:write',
        'requests:read',
        'requests:write',
        'settings:write',
    ],
    super_admin: [
        'admin:access',
        'analytics:read',
        'audit:read',
        'catalog:write',
        'cms:write',
        'customers:read',
        'customers:write',
        'media:write',
        'orders:read',
        'orders:write',
        'requests:read',
        'requests:write',
        'settings:write',
    ],
};

export function isRole(value: unknown): value is Role {
    return typeof value === 'string' && ROLES.includes(value as Role);
}

export function permissionsForRole(role: Role): Permission[] {
    return rolePermissions[role];
}

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
    return Boolean(user?.permissions.includes(permission));
}

export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
    return permissions.some((permission) => hasPermission(user, permission));
}

export function roleCanAccess(role: Role, permission: Permission): boolean {
    return rolePermissions[role].includes(permission);
}
