'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth, requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { logAudit } from '@/lib/audit'
import type { ParseResult } from '@/lib/attendance-parser'

// Untyped client for new tables not yet in generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ── Types ──

interface AttendanceRecord {
    id: string
    periodId: string
    employeeId: string
    date: string
    checkIn: string | null
    checkOut: string | null
    workHours: number
    source: string
    note: string | null
    state: string
}

interface AttendanceSummary {
    id: string
    name: string
    startDate: string
    endDate: string
    state: string
    importedBy: string | null
    importedAt: string | null
    createdAt: string
    employeeCount: number
    totalWorkDays: number
    pendingCount: number
}

interface EmployeeAttendanceSummary {
    employeeId: string
    employeeName: string
    machineCode: string | null
    workDays: number
    avgHours: number
    pendingCount: number
}

// ── Period CRUD ──

export async function getAttendancePeriods(): Promise<AttendanceSummary[]> {
    await requirePermission('hr.view')

    const { data: periods } = await db
        .from('attendance_periods')
        .select('*')
        .order('startDate', { ascending: false })

    if (!periods || periods.length === 0) return []

    const { data: records } = await db
        .from('attendance_records')
        .select('periodId, employeeId, workHours, state')

    return periods.map((p: any) => {
        const periodRecords = (records || []).filter((r: any) => r.periodId === p.id)
        const uniqueEmployees = new Set(periodRecords.map((r: any) => r.employeeId))
        const workDayRecords = periodRecords.filter((r: any) => Number(r.workHours) > 0)
        const pendingRecords = periodRecords.filter((r: any) => r.state === 'PENDING')

        return {
            ...p,
            employeeCount: uniqueEmployees.size,
            totalWorkDays: workDayRecords.length,
            pendingCount: pendingRecords.length,
        } as AttendanceSummary
    })
}

export async function getAttendancePeriod(id: string) {
    await requirePermission('hr.view')

    const { data: period } = await db
        .from('attendance_periods')
        .select('*')
        .eq('id', id)
        .single()

    if (!period) return null

    const { data: records } = await db
        .from('attendance_records')
        .select('*')
        .eq('periodId', id)
        .order('date')

    const { data: employees } = await db.from('employees').select('id, userId, machineCode')
    const { data: users } = await supabase.from('users').select('id, name')

    // Group by employee
    const employeeMap = new Map<string, { records: AttendanceRecord[]; name: string; machineCode: string | null }>()
    for (const record of (records || [])) {
        const emp = (employees || []).find((e: any) => e.id === record.employeeId)
        const user = emp ? (users || []).find((u: any) => u.id === emp.userId) : null
        const key = record.employeeId as string

        if (!employeeMap.has(key)) {
            employeeMap.set(key, {
                records: [],
                name: (user?.name as string) || 'Unknown',
                machineCode: (emp?.machineCode as string) || null,
            })
        }
        employeeMap.get(key)!.records.push(record as AttendanceRecord)
    }

    const employeeSummaries: EmployeeAttendanceSummary[] = []
    for (const [empId, data] of employeeMap) {
        const workRecords = data.records.filter((r) => r.workHours > 0)
        const pending = data.records.filter((r) => r.state === 'PENDING')
        const totalHours = workRecords.reduce((s, r) => s + Number(r.workHours), 0)

        employeeSummaries.push({
            employeeId: empId,
            employeeName: data.name,
            machineCode: data.machineCode,
            workDays: workRecords.length,
            avgHours: workRecords.length > 0 ? Math.round((totalHours / workRecords.length) * 10) / 10 : 0,
            pendingCount: pending.length,
        })
    }

    return { period, employees: employeeSummaries, records: records || [] }
}

// ── Import from parsed Excel ──

export async function importAttendance(parsed: ParseResult): Promise<ActionResult<{ periodId: string; imported: number }>> {
    const user = await requirePermission('hr.edit')

    if (!parsed.startDate || !parsed.endDate) {
        return fail('Không xác định được kỳ chấm công từ file Excel')
    }

    // Create or get period
    const { data: existing } = await db
        .from('attendance_periods')
        .select('id, state')
        .eq('startDate', parsed.startDate)
        .eq('endDate', parsed.endDate)
        .single()

    if (existing && existing.state === 'LOCKED') {
        return fail('Kỳ chấm công này đã khóa, không thể import lại')
    }

    let periodId: string
    if (existing) {
        await db.from('attendance_records').delete().eq('periodId', existing.id)
        await db.from('attendance_periods').update({
            name: parsed.periodName,
            importedBy: user.id,
            importedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).eq('id', existing.id)
        periodId = existing.id as string
    } else {
        const { data: newPeriod, error } = await db.from('attendance_periods').insert({
            name: parsed.periodName,
            startDate: parsed.startDate,
            endDate: parsed.endDate,
            state: 'DRAFT',
            importedBy: user.id,
            importedAt: new Date().toISOString(),
        }).select().single()

        if (error || !newPeriod) return fail(`Tạo kỳ chấm công thất bại: ${error?.message}`)
        periodId = newPeriod.id as string
    }

    // Map machineId → employeeId
    const { data: employees } = await db.from('employees').select('id, machineCode')
    const machineMap = new Map<string, string>()
    for (const emp of (employees || [])) {
        if (emp.machineCode) machineMap.set(emp.machineCode as string, emp.id as string)
    }

    let importedCount = 0

    for (const sheet of parsed.sheets) {
        const employeeId = machineMap.get(sheet.machineId)
        if (!employeeId) continue

        const rows = sheet.rows
            .filter((r) => r.date)
            .map((r) => ({
                periodId,
                employeeId,
                date: r.date,
                checkIn: r.checkIn || null,
                checkOut: r.checkOut || null,
                workHours: r.workHours,
                source: 'MACHINE',
                state: 'ORIGINAL',
            }))

        if (rows.length > 0) {
            for (let i = 0; i < rows.length; i += 50) {
                const batch = rows.slice(i, i + 50)
                await db.from('attendance_records').insert(batch)
            }
            importedCount += rows.length
        }
    }

    await logAudit({
        userId: user.id,
        action: 'create',
        entity: 'attendance',
        entityId: periodId,
        details: `Import chấm công: ${parsed.periodName}, ${parsed.sheets.length} NV, ${importedCount} dòng`,
    })

    return ok({ periodId, imported: importedCount })
}

// ── Employee self-view ──

export async function getMyAttendance(periodId?: string) {
    const user = await requireAuth()

    const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('userId', user.id)
        .single()

    if (!employee) return null

    let targetPeriodId = periodId
    if (!targetPeriodId) {
        const { data: latestPeriod } = await db
            .from('attendance_periods')
            .select('id')
            .order('startDate', { ascending: false })
            .limit(1)
            .single()

        if (!latestPeriod) return null
        targetPeriodId = latestPeriod.id as string
    }

    const { data: period } = await db
        .from('attendance_periods')
        .select('*')
        .eq('id', targetPeriodId)
        .single()

    if (!period) return null

    const { data: records } = await db
        .from('attendance_records')
        .select('*')
        .eq('periodId', targetPeriodId)
        .eq('employeeId', employee.id)
        .order('date')

    const workRecords = (records || []).filter((r: any) => Number(r.workHours) > 0)
    const pendingRecords = (records || []).filter((r: any) => r.state === 'PENDING')
    const totalHours = workRecords.reduce((s: number, r: any) => s + Number(r.workHours), 0)

    return {
        period,
        records: records || [],
        summary: {
            workDays: workRecords.length,
            totalHours: Math.round(totalHours * 10) / 10,
            avgHours: workRecords.length > 0 ? Math.round((totalHours / workRecords.length) * 10) / 10 : 0,
            pendingCount: pendingRecords.length,
        },
    }
}

// ── Employee add missing attendance ──

export async function addMissingAttendance(
    periodId: string,
    date: string,
    checkIn: string,
    checkOut: string,
    note: string,
): Promise<ActionResult<void>> {
    const user = await requireAuth()

    const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('userId', user.id)
        .single()

    if (!employee) return fail('Không tìm thấy hồ sơ nhân viên')

    const { data: period } = await db
        .from('attendance_periods')
        .select('id, state')
        .eq('id', periodId)
        .single()

    if (!period) return fail('Kỳ chấm công không tồn tại')
    if (period.state === 'LOCKED') return fail('Kỳ chấm công đã khóa')

    if (!note || note.trim().length < 3) {
        return fail('Vui lòng nhập lý do bổ sung (tối thiểu 3 ký tự)')
    }

    const { data: existing } = await db
        .from('attendance_records')
        .select('id, checkIn, checkOut')
        .eq('periodId', periodId)
        .eq('employeeId', employee.id)
        .eq('date', date)
        .single()

    const inParts = checkIn.split(':').map(Number)
    const outParts = checkOut.split(':').map(Number)
    const inMin = inParts[0] * 60 + (inParts[1] || 0)
    const outMin = outParts[0] * 60 + (outParts[1] || 0)
    let hours = (outMin - inMin) / 60
    if (hours > 5) hours -= 1
    hours = Math.round(hours * 100) / 100

    if (existing) {
        await db.from('attendance_records').update({
            checkIn: checkIn + ':00',
            checkOut: checkOut + ':00',
            workHours: hours,
            source: 'EMPLOYEE_ADDED',
            note,
            state: 'PENDING',
            updatedAt: new Date().toISOString(),
        }).eq('id', existing.id)
    } else {
        await db.from('attendance_records').insert({
            periodId,
            employeeId: employee.id,
            date,
            checkIn: checkIn + ':00',
            checkOut: checkOut + ':00',
            workHours: hours,
            source: 'EMPLOYEE_ADDED',
            note,
            state: 'PENDING',
        })
    }

    await logAudit({
        userId: user.id,
        action: 'create',
        entity: 'attendance',
        entityId: periodId,
        details: `Bổ sung chấm công: ${date}, ${checkIn}-${checkOut}, Lý do: ${note}`,
    })

    return ok(undefined as void)
}

// ── HR approve/reject ──

export async function reviewAttendanceRecord(
    recordId: string,
    action: 'APPROVED' | 'REJECTED',
): Promise<ActionResult<void>> {
    await requirePermission('hr.edit')

    const { data: record } = await db
        .from('attendance_records')
        .select('id, state')
        .eq('id', recordId)
        .single()

    if (!record) return fail('Bản ghi không tồn tại')
    if (record.state !== 'PENDING') return fail('Bản ghi không ở trạng thái chờ duyệt')

    await db.from('attendance_records').update({
        state: action,
        updatedAt: new Date().toISOString(),
    }).eq('id', recordId)

    return ok(undefined as void)
}

// ── Lock/Unlock period ──

export async function updatePeriodState(
    periodId: string,
    newState: 'DRAFT' | 'REVIEW' | 'LOCKED',
): Promise<ActionResult<void>> {
    const user = await requirePermission('hr.edit')

    const { data: period } = await db
        .from('attendance_periods')
        .select('id, state')
        .eq('id', periodId)
        .single()

    if (!period) return fail('Kỳ chấm công không tồn tại')

    if (newState === 'LOCKED') {
        const { data: pendingRecords } = await db
            .from('attendance_records')
            .select('id')
            .eq('periodId', periodId)
            .eq('state', 'PENDING')

        if (pendingRecords && pendingRecords.length > 0) {
            return fail(`Còn ${pendingRecords.length} bản ghi chờ duyệt. Vui lòng duyệt hết trước khi khóa.`)
        }
    }

    await db.from('attendance_periods').update({
        state: newState,
        updatedAt: new Date().toISOString(),
    }).eq('id', periodId)

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'attendance',
        entityId: periodId,
        details: `Chuyển trạng thái kỳ chấm công: ${newState}`,
    })

    return ok(undefined as void)
}

// ── Get work days for Payroll integration ──

export async function getAttendanceWorkDays(employeeId: string, startDate: string, endDate: string) {
    const { data: period } = await db
        .from('attendance_periods')
        .select('id')
        .gte('startDate', startDate)
        .lte('endDate', endDate)
        .eq('state', 'LOCKED')
        .single()

    if (!period) return null

    const { data: records } = await db
        .from('attendance_records')
        .select('workHours, state')
        .eq('periodId', period.id)
        .eq('employeeId', employeeId)

    const approved = (records || []).filter((r: any) => r.state === 'ORIGINAL' || r.state === 'APPROVED')
    const workDays = approved.filter((r: any) => Number(r.workHours) > 0).length
    const totalHours = approved.reduce((s: number, r: any) => s + Number(r.workHours), 0)

    return {
        workDays,
        totalHours: Math.round(totalHours * 10) / 10,
        standardDays: 24,
        ratio: Math.round((workDays / 24) * 1000) / 1000,
    }
}

// ── Get all periods (for dropdown) ──

export async function getAttendancePeriodOptions() {
    await requireAuth()
    const { data } = await db
        .from('attendance_periods')
        .select('id, name, state')
        .order('startDate', { ascending: false })

    return (data || []) as Array<{ id: string; name: string; state: string }>
}

// ── Employee detail in a period (HR view) ──

export async function getEmployeeAttendanceDetail(periodId: string, employeeId: string) {
    await requirePermission('hr.view')

    const { data: records } = await db
        .from('attendance_records')
        .select('*')
        .eq('periodId', periodId)
        .eq('employeeId', employeeId)
        .order('date')

    const { data: employee } = await db.from('employees').select('id, userId, machineCode').eq('id', employeeId).single()
    const { data: user } = employee?.userId
        ? await supabase.from('users').select('id, name').eq('id', employee.userId).single()
        : { data: null }

    return {
        employee: { ...employee, name: user?.name || '' },
        records: records || [],
    }
}
