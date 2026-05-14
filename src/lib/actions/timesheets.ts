'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { timesheetEntrySchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import type { TimesheetEntry } from '@/lib/types'
import type { Database } from '@/lib/database.types'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

async function getCurrentEmployeeForUser(userId: string) {
    const { data: employee } = await supabase
        .from('employees')
        .select('id, userId')
        .eq('userId', userId)
        .single()

    return employee
}

export async function getTimesheets(filters?: { employeeId?: string; projectId?: string; startDate?: string; endDate?: string }) {
    const user = await requireAuth()
    const isManager = MANAGER_ROLES.includes(user.role)
    const currentEmployee = await getCurrentEmployeeForUser(user.id)

    // Non-managers must have an employee record and can only see their own
    if (!isManager) {
        if (!currentEmployee) return []
        if (filters?.employeeId && filters.employeeId !== currentEmployee.id) return []
    }

    let query = supabase.from('timesheets').select('*').order('date', { ascending: false })

    // Managers can filter by specific employee; non-managers always filter to self
    if (isManager && filters?.employeeId) {
        query = query.eq('employeeId', filters.employeeId)
    } else if (!isManager && currentEmployee) {
        query = query.eq('employeeId', currentEmployee.id)
    }

    if (filters?.projectId) query = query.eq('projectId', filters.projectId)
    if (filters?.startDate) query = query.gte('date', filters.startDate)
    if (filters?.endDate) query = query.lte('date', filters.endDate)

    const [{ data }, { data: projects }, { data: employees }, { data: users }] = await Promise.all([
        query,
        supabase.from('projects').select('id, name'),
        supabase.from('employees').select('id, userId'),
        supabase.from('users').select('id, name'),
    ])

    return (data || []).map((timesheet) => {
        const emp = (employees || []).find((e) => e.id === timesheet.employeeId)
        const owner = emp ? (users || []).find((u) => u.id === emp.userId) : null
        return {
            ...timesheet,
            project: (projects || []).find((project) => project.id === timesheet.projectId) || null,
            employeeName: owner?.name ?? '-',
        }
    })
}

export async function saveWeekTimesheets(employeeId: string, entries: TimesheetEntry[]): Promise<ActionResult<void>> {
    const user = await requireAuth()

    const { data: employee } = await supabase
        .from('employees')
        .select('id, userId')
        .eq('id', employeeId)
        .single()

    if (!employee || employee.userId !== user.id) {
        return fail('You can only submit timesheets for your own employee record')
    }

    for (const entry of entries) {
        const parsed = parseInput(timesheetEntrySchema, entry)
        if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    }

    const dates = [...new Set(entries.map((entry) => entry.date))]
    if (dates.length > 0) {
        await supabase.from('timesheets').delete().eq('employeeId', employeeId).in('date', dates)
    }

    const rows = entries
        .filter((entry) => entry.hours > 0)
        .map((entry) => ({
            employeeId,
            userId: user.id,
            projectId: entry.projectId,
            date: entry.date,
            hours: entry.hours,
        }))

    if (rows.length > 0) {
        const { error } = await supabase.from('timesheets').insert(rows)
        if (error) return fail(error.message)
    }

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'timesheet',
        entityId: employeeId,
        details: `Saved ${rows.length} timesheet entries`,
    })

    return ok(undefined as void)
}

export async function getTimesheetsWithDetails() {
    const user = await requireAuth()
    const isManager = MANAGER_ROLES.includes(user.role)
    const currentEmployee = await getCurrentEmployeeForUser(user.id)

    let timesheetsQuery = supabase.from('timesheets').select('*').order('date', { ascending: false })

    // Non-managers only see their own timesheets
    if (!isManager) {
        if (!currentEmployee) return []
        timesheetsQuery = timesheetsQuery.eq('employeeId', currentEmployee.id)
    }

    const { data: timesheets } = await timesheetsQuery

    const { data: employees } = await supabase.from('employees').select('id, userId')
    const { data: users } = await supabase.from('users').select('id, name')
    const { data: projects } = await supabase.from('projects').select('id, name')

    return (timesheets || []).map((timesheet: Record<string, unknown>) => {
        const employee = (employees || []).find((item: Record<string, unknown>) => item.id === timesheet.employeeId)
        const owner = employee ? (users || []).find((item: Record<string, unknown>) => item.id === employee.userId) : null
        const project = (projects || []).find((item: Record<string, unknown>) => item.id === timesheet.projectId)

        return {
            ...timesheet,
            userName: owner?.name ?? '-',
            projectName: project?.name ?? '-',
        }
    })
}

export async function getWeekTimesheets(employeeId: string, weekStart: string) {
    const user = await requireAuth()
    const currentEmployee = await getCurrentEmployeeForUser(user.id)
    if (!currentEmployee || currentEmployee.id !== employeeId) return []

    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employeeId', employeeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date')

    return (data || []) as Array<Record<string, unknown>>
}

export async function createTimesheet(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()
    const parsed = parseInput(timesheetEntrySchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const currentEmployee = await getCurrentEmployeeForUser(user.id)
    if (!currentEmployee) return fail('Employee record not found for current user')

    const insertRow: Database['public']['Tables']['timesheets']['Insert'] = {
        ...parsed.data,
        employeeId: currentEmployee.id,
        userId: user.id,
    }

    const { data, error } = await supabase.from('timesheets').insert(insertRow).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'timesheet', entityId: data.id })
    return ok(data as Record<string, unknown>)
}

export async function updateTimesheet(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()
    const { data: existing } = await supabase.from('timesheets').select('id, userId').eq('id', id).single()
    if (!existing || existing.userId !== user.id) {
        return fail('You do not have permission to edit this timesheet')
    }

    const parsed = parseInput(timesheetEntrySchema.partial(), formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase
        .from('timesheets')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ ...parsed.data, updatedAt: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'timesheet', entityId: id })
    return ok(data)
}

export async function deleteTimesheet(id: string): Promise<ActionResult<void>> {
    const user = await requireAuth()
    const { data: existing } = await supabase.from('timesheets').select('id, userId').eq('id', id).single()
    if (!existing || existing.userId !== user.id) {
        return fail('You do not have permission to delete this timesheet')
    }

    const { error } = await supabase.from('timesheets').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'timesheet', entityId: id })
    return ok(undefined as void)
}
