'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { timesheetEntrySchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import type { TimesheetEntry } from '@/lib/types'
import type { Database } from '@/lib/database.types'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

export interface OverviewEmployee {
    employeeId: string
    name: string
    department: string
    totalHours: number
    daysWorked: number
    projects: string[]
}

export interface TimesheetOverviewData {
    year: number
    month: number
    employees: OverviewEmployee[]
    totalHours: number
    totalEmployees: number
    avgHoursPerEmployee: number
    daysInMonth: number
}

export async function getTimesheetOverview(year: number, month: number): Promise<TimesheetOverviewData> {
    await requireAuth()

    // Date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const [{ data: timesheets }, { data: employees }, { data: users }] = await Promise.all([
        supabase.from('timesheets').select('employeeId, hours, date, projectId').gte('date', startDate).lte('date', endDate),
        supabase.from('employees').select('id, userId, department'),
        supabase.from('users').select('id, name'),
    ])

    const { data: projects } = await supabase.from('projects').select('id, name')

    // Aggregate by employee
    const empMap = new Map<string, { hours: number; dates: Set<string>; projectIds: Set<string> }>()
    for (const t of (timesheets || [])) {
        const key = t.employeeId
        if (!key) continue
        if (!empMap.has(key)) empMap.set(key, { hours: 0, dates: new Set(), projectIds: new Set() })
        const entry = empMap.get(key)!
        entry.hours += Number(t.hours || 0)
        entry.dates.add(t.date)
        if (t.projectId) entry.projectIds.add(t.projectId)
    }

    const overviewEmployees: OverviewEmployee[] = []
    for (const [empId, agg] of empMap) {
        const emp = (employees || []).find(e => e.id === empId)
        const user = emp ? (users || []).find(u => u.id === emp.userId) : null
        overviewEmployees.push({
            employeeId: empId,
            name: user?.name || '—',
            department: (emp as Record<string, unknown>)?.department as string || '—',
            totalHours: Math.round(agg.hours * 10) / 10,
            daysWorked: agg.dates.size,
            projects: Array.from(agg.projectIds).map(pid => (projects || []).find(p => p.id === pid)?.name || '—'),
        })
    }

    // Sort by hours descending
    overviewEmployees.sort((a, b) => b.totalHours - a.totalHours)

    const totalHours = overviewEmployees.reduce((s, e) => s + e.totalHours, 0)

    return {
        year,
        month,
        employees: overviewEmployees,
        totalHours: Math.round(totalHours * 10) / 10,
        totalEmployees: overviewEmployees.length,
        avgHoursPerEmployee: overviewEmployees.length > 0 ? Math.round(totalHours / overviewEmployees.length * 10) / 10 : 0,
        daysInMonth: lastDay,
    }
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/**
 * Sync attendance records → timesheet entries.
 * For each employee workday in the attendance period, creates an "unassigned" timesheet
 * entry if no timesheet entries exist for that employee+date combo.
 * Employees can then allocate hours to specific projects manually.
 */
export async function syncFromAttendance(periodId: string): Promise<ActionResult<{ synced: number; skipped: number }>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) {
        return fail('Chỉ quản lý mới có thể đồng bộ chấm công → timesheet')
    }

    // Get attendance records for this period
    const { data: attendanceRecords } = await db
        .from('attendance_records')
        .select('employeeId, date, workHours, state')
        .eq('periodId', periodId)

    if (!attendanceRecords || attendanceRecords.length === 0) {
        return fail('Không có dữ liệu chấm công trong kỳ này')
    }

    // Get employee → userId mapping
    const { data: employees } = await supabase.from('employees').select('id, userId')
    const empUserMap = new Map<string, string>()
    for (const emp of (employees || [])) {
        empUserMap.set(emp.id, emp.userId)
    }

    // Get existing timesheet dates per employee to avoid duplicates
    const dates = [...new Set(attendanceRecords.map((r: Record<string, unknown>) => r.date as string))]
    const empIds = [...new Set(attendanceRecords.map((r: Record<string, unknown>) => r.employeeId as string))]

    const { data: existingTimesheets } = await supabase
        .from('timesheets')
        .select('employeeId, date')
        .in('employeeId', empIds as string[])
        .in('date', dates as string[])

    // Build a set of existing employee+date combos
    const existingKeys = new Set(
        (existingTimesheets || []).map(t => `${t.employeeId}|${t.date}`)
    )

    // Create new timesheet entries for workdays not yet in timesheets
    let synced = 0
    let skipped = 0
    const rowsToInsert: Array<Record<string, unknown>> = []

    for (const record of attendanceRecords) {
        const empId = record.employeeId as string
        const date = record.date as string
        const hours = Number(record.workHours || 0)
        const state = record.state as string

        // Skip non-work days and rejected records
        if (hours <= 0 || state === 'REJECTED') {
            skipped++
            continue
        }

        const key = `${empId}|${date}`
        if (existingKeys.has(key)) {
            skipped++
            continue
        }

        const userId = empUserMap.get(empId)
        if (!userId) {
            skipped++
            continue
        }

        rowsToInsert.push({
            id: `ts-sync-${empId}-${date}`,
            userId,
            employeeId: empId,
            projectId: null,
            date,
            hours,
            description: 'Tự động từ chấm công — chưa phân bổ dự án',
            phase: null,
            source: 'ATTENDANCE_SYNC',
        })
        existingKeys.add(key)
        synced++
    }

    // Batch insert
    for (let i = 0; i < rowsToInsert.length; i += 50) {
        const batch = rowsToInsert.slice(i, i + 50)
        await db.from('timesheets').insert(batch)
    }

    await logAudit({
        userId: user.id,
        action: 'create',
        entity: 'timesheet',
        entityId: periodId,
        details: `Đồng bộ chấm công → timesheet: ${synced} mới, ${skipped} bỏ qua`,
    })

    return ok({ synced, skipped })
}

// ── Phase 2: Approval Workflow ──
// NOTE: TimesheetStatus type, STATUS_COLORS, STATUS_LABELS are defined here
// but types cannot be exported from 'use server' modules.
// Consumer components should define their own type or import from a shared module.

type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

/**
 * Submit all DRAFT timesheets for an employee in a given month.
 * Employee submits their own timesheets for PM review.
 */
export async function submitTimesheets(employeeId: string, year: number, month: number): Promise<ActionResult<{ count: number }>> {
    const user = await requireAuth()
    const currentEmployee = await getCurrentEmployeeForUser(user.id)
    if (!currentEmployee || currentEmployee.id !== employeeId) {
        return fail('Bạn chỉ có thể gửi timesheet của mình')
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('timesheets')
        .update({ status: 'SUBMITTED', submittedAt: new Date().toISOString() })
        .eq('employeeId', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['DRAFT', null])
        .select('id')

    if (error) return fail(error.message)

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'timesheet',
        entityId: employeeId,
        details: `Gửi duyệt ${(data || []).length} timesheet entries (${month}/${year})`,
    })

    return ok({ count: (data || []).length })
}

/**
 * Approve all SUBMITTED timesheets for an employee in a given month.
 * Only managers can approve.
 */
export async function approveTimesheets(employeeId: string, year: number, month: number): Promise<ActionResult<{ count: number }>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) {
        return fail('Chỉ quản lý mới có thể duyệt timesheet')
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('timesheets')
        .update({
            status: 'APPROVED',
            approvedBy: user.id,
            approvedAt: new Date().toISOString(),
        })
        .eq('employeeId', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'SUBMITTED')
        .select('id')

    if (error) return fail(error.message)

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'timesheet',
        entityId: employeeId,
        details: `Duyệt ${(data || []).length} timesheet entries (${month}/${year})`,
    })

    return ok({ count: (data || []).length })
}

/**
 * Reject SUBMITTED timesheets back to DRAFT.
 */
export async function rejectTimesheets(employeeId: string, year: number, month: number): Promise<ActionResult<{ count: number }>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) {
        return fail('Chỉ quản lý mới có thể từ chối timesheet')
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from('timesheets')
        .update({ status: 'REJECTED' })
        .eq('employeeId', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'SUBMITTED')
        .select('id')

    if (error) return fail(error.message)

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'timesheet',
        entityId: employeeId,
        details: `Từ chối ${(data || []).length} timesheet entries (${month}/${year})`,
    })

    return ok({ count: (data || []).length })
}

export interface ApprovalSummary {
    employeeId: string
    name: string
    department: string
    totalHours: number
    draftCount: number
    submittedCount: number
    approvedCount: number
    rejectedCount: number
    status: TimesheetStatus
}

/**
 * Get approval summary for all employees in a month.
 * Used by managers in the overview page.
 */
export async function getApprovalSummary(year: number, month: number): Promise<ApprovalSummary[]> {
    await requireAuth()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: timesheets } = await (supabase as any)
        .from('timesheets')
        .select('employeeId, hours, status')
        .gte('date', startDate)
        .lte('date', endDate)

    const { data: employees } = await supabase.from('employees').select('id, userId, department')
    const { data: users } = await supabase.from('users').select('id, name')

    const empMap = new Map<string, {
        hours: number; draft: number; submitted: number; approved: number; rejected: number
    }>()

    for (const t of (timesheets || [])) {
        if (!t.employeeId) continue
        if (!empMap.has(t.employeeId)) empMap.set(t.employeeId, { hours: 0, draft: 0, submitted: 0, approved: 0, rejected: 0 })
        const entry = empMap.get(t.employeeId)!
        entry.hours += Number(t.hours || 0)
        const status = (t.status || 'DRAFT') as TimesheetStatus
        if (status === 'DRAFT' || !t.status) entry.draft++
        else if (status === 'SUBMITTED') entry.submitted++
        else if (status === 'APPROVED') entry.approved++
        else if (status === 'REJECTED') entry.rejected++
    }

    const result: ApprovalSummary[] = []
    for (const [empId, agg] of empMap) {
        const emp = (employees || []).find(e => e.id === empId)
        const user = emp ? (users || []).find(u => u.id === emp.userId) : null
        // Determine overall status
        let status: TimesheetStatus = 'DRAFT'
        if (agg.approved > 0 && agg.submitted === 0 && agg.draft === 0) status = 'APPROVED'
        else if (agg.submitted > 0) status = 'SUBMITTED'
        else if (agg.rejected > 0) status = 'REJECTED'

        result.push({
            employeeId: empId,
            name: user?.name || '—',
            department: (emp as Record<string, unknown>)?.department as string || '—',
            totalHours: Math.round(agg.hours * 10) / 10,
            draftCount: agg.draft,
            submittedCount: agg.submitted,
            approvedCount: agg.approved,
            rejectedCount: agg.rejected,
            status,
        })
    }

    return result.sort((a, b) => {
        const order = { SUBMITTED: 0, DRAFT: 1, REJECTED: 2, APPROVED: 3 }
        return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })
}
