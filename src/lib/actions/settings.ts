'use server'

import { supabase } from '@/lib/supabase'

export async function getSettings(): Promise<Record<string, string>> {
    const { data } = await supabase.from('settings').select('key, value')
    const result: Record<string, string> = {}
    for (const row of data || []) {
        result[(row as any).key] = (row as any).value
    }
    return result
}

export async function saveSettings(settings: Record<string, string>) {
    const rows = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updatedAt: new Date().toISOString(),
    }))

    for (const row of rows) {
        const { error } = await supabase
            .from('settings')
            .upsert(row, { onConflict: 'key' })
        if (error) throw new Error(error.message)
    }
}
