'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { settingsSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function getSettings(): Promise<Record<string, string>> {
    const { data } = await supabase.from('settings').select('key, value')
    const result: Record<string, string> = {}
    for (const row of data || []) {
        const r = row as Record<string, string>
        result[r.key] = r.value
    }
    return result
}

export async function saveSettings(settings: unknown): Promise<ActionResult<void>> {
    const user = await requirePermission('settings.edit')
    const parsed = parseInput(settingsSchema, settings)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const rows = Object.entries(parsed.data).map(([key, value]) => ({
        key,
        value,
        updatedAt: new Date().toISOString(),
    }))

    for (const row of rows) {
        const { error } = await supabase
            .from('settings')
            .upsert(row, { onConflict: 'key' })
        if (error) return fail(error.message)
    }

    await logAudit({ userId: user.id, action: 'update', entity: 'settings', entityId: 'company', details: `Cập nhật ${rows.length} cài đặt` })
    return ok(undefined as void)
}
