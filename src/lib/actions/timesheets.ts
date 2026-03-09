'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { timesheetEntrySchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import type { TimesheetEntry } from '@/lib/types'

export async function getTimesheets(filters?: { employeeId?: string; projectId?: string; startDate?: string; endDate?: string }) {
    let query = supabase.from('timesheets').select('*').order('date', { ascending: false })

    if (filters?.employeeId) query = query.eq('employeeId', filters.employeeId)
    if (filters?.projectId) query = query.eq('projectId', filters.projectId)
    if (filters?.startDate) query = query.gte('date', filters.startDate)
    if (filters?.endDate) query = query.lte('date', filters.endDate)

    const { data } = await query

    // Join project info
    const { data: projects } = await supabase.from('projects').select('id, name')
    return (data || []).map((t) => ({
        ...t,
        project: (projects || []).find((p) => p.id === t.projectId) || null,
    }))
}

export async function saveWeekTimesheets(employeeId: string, entries: TimesheetEntry[]): Promise<ActionResult<void>> {
    const user = await requireAuth()

    // Validate each entry
    for (const entry of entries) {
        const parsed = parseInput(timesheetEntrySchema, entry)
        if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    }

    // Delete existing entries for the dates and re-insert
    const dates = [...new Set(entries.map(e => e.date))]
    if (dates.length > 0) {
        for (const date of dates) {
            await supabase.from('timesheets').delete().eq('employeeId', employeeId).eq('date', date)
        }
    }

    // Insert only non-zero entries
    const rows = entries.filter(e => e.hours > 0).map(e => ({
        employeeId,
        projectId: e.projectId,
        date: e.date,
        hours: e.hours,
    }))

    if (rows.length > 0) {
        const { error } = await supabase.from('timesheets').insert(rows)
        if (error) return fail(error.message)
    }

    await logAudit({ userId: user.id, action: 'update', entity: 'timesheet', entityId: employeeId, details: `Lưu ${rows.length} timesheet entries` })
    return ok(undefined as void)
}

export async function getTimesheetsWithDetails() {
    const { data: timesheets } = await supabase.from('timesheets').select('*').order('date', { ascending: false })
    const { data: employees } = await supabase.from('employees').select('id, userId')
    const { data: users } = await supabase.from('users').select('id, name')
    const { data: projects } = await supabase.from('projects').select('id, name')

    return (timesheets || []).map((ts) => {
        const emp = (employees || []).find((e) => e.id === ts.employeeId)
        const user = emp ? (users || []).find((u) => u.id === emp.userId) : null
        const project = (projects || []).find((p) => p.id === ts.projectId)
        return { ...ts, userName: user?.name ?? '—', projectName: project?.name ?? '—' }
    })
}

export async function getWeekTimesheets(employeeId: string, weekStart: string) {
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employeeId', employeeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date')

    return data || []
}

export async function createTimesheet(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()
    const parsed = parseInput(timesheetEntrySchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('timesheets').insert(parsed.data).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'timesheet', entityId: data.id })
    return ok(data)
}

export async function updateTimesheet(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()
    const { data, error } = await supabase
        .from('timesheets')
        .update({ ...(formData as Record<string, unknown>), updatedAt: new Date().toISOString() })
        .eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'timesheet', entityId: id })
    return ok(data)
}

export async function deleteTimesheet(id: string): Promise<ActionResult<void>> {
    const user = await requireAuth()
    const { error } = await supabase.from('timesheets').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'timesheet', entityId: id })
    return ok(undefined as void)
}
