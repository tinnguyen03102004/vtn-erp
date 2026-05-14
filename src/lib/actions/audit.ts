'use server'

import { supabase } from '@/lib/supabase'
import { ok, fail, type ActionResult } from '@/lib/action-result'

export interface AuditLogEntry {
    id: string
    userId: string | null
    userName: string | null
    action: string
    entity: string
    entityId: string | null
    details: string | null
    metadata: unknown
    createdAt: string
}

interface AuditLogsResult {
    logs: AuditLogEntry[]
    total: number
}

export async function getAuditLogs(filters?: {
    action?: string
    entity?: string
    page?: number
    limit?: number
}): Promise<ActionResult<AuditLogsResult>> {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 50
    const offset = (page - 1) * limit

    let query = supabase
        .from('audit_logs')
        .select('id, userId, action, entity, entityId, details, metadata, createdAt', { count: 'exact' })

    if (filters?.action) {
        query = query.eq('action', filters.action)
    }
    if (filters?.entity) {
        query = query.eq('entity', filters.entity)
    }

    query = query.order('createdAt', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return fail(error.message)

    // Fetch user names for log entries
    const userIds = [...new Set((data ?? []).map(d => d.userId).filter(Boolean))] as string[]
    let userMap: Record<string, string> = {}

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds)

        if (users) {
            userMap = Object.fromEntries(users.filter(u => u.name).map(u => [u.id, u.name as string]))
        }
    }

    const logs: AuditLogEntry[] = (data ?? []).map(d => ({
        ...d,
        userName: d.userId ? (userMap[d.userId] ?? null) : null,
    }))

    return ok({ logs, total: count ?? 0 })
}

export async function getAuditFilters(): Promise<ActionResult<{ actions: string[]; entities: string[] }>> {
    const [actionsRes, entitiesRes] = await Promise.all([
        supabase.from('audit_logs').select('action').limit(100),
        supabase.from('audit_logs').select('entity').limit(100),
    ])

    if (actionsRes.error) return fail(actionsRes.error.message)
    if (entitiesRes.error) return fail(entitiesRes.error.message)

    const actions = [...new Set((actionsRes.data ?? []).map(d => d.action))].sort()
    const entities = [...new Set((entitiesRes.data ?? []).map(d => d.entity))].sort()

    return ok({ actions, entities })
}
