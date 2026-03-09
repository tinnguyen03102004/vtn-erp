'use server'

// ================================================================
// Audit Trail — Logs important actions to audit_logs table
// ================================================================
import { supabase } from '@/lib/supabase'

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

/**
 * Log an audit trail entry. Non-blocking — errors are silently ignored
 * to avoid breaking the main operation.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
    try {
        await supabase.from('audit_logs').insert({
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
