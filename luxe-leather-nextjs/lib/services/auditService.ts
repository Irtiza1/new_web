import { supabase } from '../supabase';

// ============================================================
// AUDIT SERVICE
// ============================================================
// Lightweight helper that writes a row to audit_logs.
// Call this from any service after a successful write operation.
//
// Usage:
//   await auditLog('products', id, 'ARCHIVE', { isActive: { from: true, to: false } });
// ============================================================

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'ARCHIVE'
    | 'RESTORE'
    | 'ANONYMIZE';

export interface ChangedFields {
    [field: string]: { from: unknown; to: unknown };
}

/**
 * Write an audit log entry.
 * This is fire-and-forget — it never throws so a logging failure
 * never breaks the caller's main operation.
 *
 * @param tableName  - DB table affected (e.g. 'products', 'orders')
 * @param recordId   - Primary key of the affected row
 * @param action     - What happened
 * @param changedFields - Optional field-level diff { field: { from, to } }
 * @param performedBy   - Admin identifier (future: session user)
 * @param ipAddress     - Request IP (optional)
 */
export async function auditLog(
    tableName: string,
    recordId: string,
    action: AuditAction,
    changedFields?: ChangedFields,
    performedBy = 'admin',
    ipAddress?: string
): Promise<void> {
    try {
        await supabase.from('audit_logs').insert([{
            table_name: tableName,
            record_id: recordId,
            action,
            changed_fields: changedFields ?? null,
            performed_by: performedBy,
            ip_address: ipAddress ?? null,
        }]);
    } catch (err) {
        // Never let audit failures surface to the user
        console.warn('[AuditService] Failed to write audit log:', err);
    }
}

/**
 * Get paginated audit logs, optionally filtered by table or record.
 */
export const getAll = async (query: {
    tableName?: string;
    recordId?: string;
    page?: number;
    limit?: number;
}) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (query.tableName) {
        dbQuery = dbQuery.eq('table_name', query.tableName);
    }
    if (query.recordId) {
        dbQuery = dbQuery.eq('record_id', query.recordId);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
        console.warn('[AuditService] getAll error:', error);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    return {
        data: data ?? [],
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / limit),
        },
    };
};
