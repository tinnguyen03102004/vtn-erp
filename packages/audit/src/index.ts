// ================================================================
// @vtn/audit — Audit Trail System
// ================================================================

export type AuditAction =
    | 'create' | 'update' | 'delete'
    | 'approve' | 'reject' | 'convert'
    | 'sign' | 'send' | 'login' | 'logout'

interface AuditEntry {
    userId: string
    action: AuditAction
    entity: string       // e.g. 'lead', 'order', 'invoice'
    entityId: string
    details?: string     // optional human-readable description
    metadata?: Record<string, unknown>
}

/** Minimal Supabase-like client interface */
interface AuditClient {
    from(table: string): {
        insert(data: Record<string, unknown>): Promise<unknown>
    }
}

let auditClient: AuditClient | null = null

/**
 * Initialize the audit module with a database client.
 * Must be called before logAudit().
 */
export function initAuditClient(client: AuditClient) {
    auditClient = client
}

/**
 * Log an audit trail entry. Non-blocking — errors are silently ignored
 * to avoid breaking the main operation.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
    if (!auditClient) {
        console.warn('[audit] Client not initialized. Call initAuditClient() first.')
        return
    }

    try {
        await auditClient.from('audit_logs').insert({
            userId: entry.userId,
            action: entry.action,
            entity: entry.entity,
            entityId: entry.entityId,
            details: entry.details || null,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
            createdAt: new Date().toISOString(),
        })
    } catch {
        // Silently ignore — audit should never break business logic
        console.warn('[audit] Failed to log:', entry.action, entry.entity, entry.entityId)
    }
}

export type { AuditEntry }
