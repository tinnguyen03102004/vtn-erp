'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { logAudit } from '@/lib/audit'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface LeaveType {
    id: string
    name: string
    description: string | null
    maxDaysPerYear: number
    isPaid: boolean
}

export interface LeaveRequest {
    id: string
    employeeId: string
    employeeName: string
    leaveTypeId: string
    leaveTypeName: string
    startDate: string
    endDate: string
    totalDays: number
    reason: string | null
    status: LeaveStatus
    approvedBy: string | null
    approverName: string | null
    createdAt: string
}

export interface LeaveBalance {
    id: string
    employeeId: string
    leaveTypeId: string
    leaveTypeName: string
    year: number
    totalDays: number
    usedDays: number
    remainingDays: number
}

async function getCurrentEmployeeForUser(userId: string) {
    const { data: employee } = await supabase
        .from('employees')
        .select('id, userId')
        .eq('userId', userId)
        .single()
    return employee
}

// ── Leave Types ──

export async function getLeaveTypes(): Promise<LeaveType[]> {
    await requireAuth()
    const { data } = await db.from('leave_types').select('*').order('name')
    return (data || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        description: t.description as string | null,
        maxDaysPerYear: Number(t.maxDaysPerYear || t.max_days_per_year || 0),
        isPaid: Boolean(t.isPaid ?? t.is_paid ?? true),
    }))
}

// ── Leave Balances ──

export async function getLeaveBalances(employeeId?: string, year?: number): Promise<LeaveBalance[]> {
    const user = await requireAuth()
    const isManager = MANAGER_ROLES.includes(user.role)
    const currentEmployee = await getCurrentEmployeeForUser(user.id)

    // Non-managers can only see their own
    const targetEmployeeId = isManager && employeeId ? employeeId : currentEmployee?.id
    if (!targetEmployeeId) return []

    const targetYear = year || new Date().getFullYear()

    const { data: balances } = await db
        .from('leave_balances')
        .select('*')
        .eq('employeeId', targetEmployeeId)
        .eq('year', targetYear)

    const leaveTypes = await getLeaveTypes()

    return (balances || []).map((b: Record<string, unknown>) => {
        const lt = leaveTypes.find(t => t.id === b.leaveTypeId)
        return {
            id: b.id as string,
            employeeId: b.employeeId as string,
            leaveTypeId: b.leaveTypeId as string,
            leaveTypeName: lt?.name || '—',
            year: Number(b.year),
            totalDays: Number(b.totalDays || 0),
            usedDays: Number(b.usedDays || 0),
            remainingDays: Number(b.totalDays || 0) - Number(b.usedDays || 0),
        }
    })
}

// ── Leave Requests ──

export async function getLeaveRequests(filters?: {
    employeeId?: string
    status?: LeaveStatus
    year?: number
}): Promise<LeaveRequest[]> {
    const user = await requireAuth()
    const isManager = MANAGER_ROLES.includes(user.role)
    const currentEmployee = await getCurrentEmployeeForUser(user.id)

    let query = db.from('leave_requests').select('*').order('createdAt', { ascending: false })

    // Non-managers can only see their own
    if (!isManager) {
        if (!currentEmployee) return []
        query = query.eq('employeeId', currentEmployee.id)
    } else if (filters?.employeeId) {
        query = query.eq('employeeId', filters.employeeId)
    }

    if (filters?.status) query = query.eq('status', filters.status)

    if (filters?.year) {
        const startDate = `${filters.year}-01-01`
        const endDate = `${filters.year}-12-31`
        query = query.gte('startDate', startDate).lte('startDate', endDate)
    }

    const { data } = await query

    // Get employee and user names
    const { data: employees } = await supabase.from('employees').select('id, userId')
    const { data: users } = await supabase.from('users').select('id, name')
    const leaveTypes = await getLeaveTypes()

    return (data || []).map((r: Record<string, unknown>) => {
        const emp = (employees || []).find(e => e.id === r.employeeId)
        const empUser = emp ? (users || []).find(u => u.id === emp.userId) : null
        const approver = r.approvedBy ? (users || []).find(u => u.id === r.approvedBy) : null
        const lt = leaveTypes.find(t => t.id === r.leaveTypeId)

        return {
            id: r.id as string,
            employeeId: r.employeeId as string,
            employeeName: empUser?.name || '—',
            leaveTypeId: r.leaveTypeId as string,
            leaveTypeName: lt?.name || '—',
            startDate: r.startDate as string,
            endDate: r.endDate as string,
            totalDays: Number(r.totalDays || 1),
            reason: r.reason as string | null,
            status: (r.status || 'PENDING') as LeaveStatus,
            approvedBy: r.approvedBy as string | null,
            approverName: approver?.name || null,
            createdAt: r.createdAt as string,
        }
    })
}

/**
 * Create a new leave request. Employee submits for their own record.
 */
export async function createLeaveRequest(input: {
    leaveTypeId: string
    startDate: string
    endDate: string
    reason?: string
}): Promise<ActionResult<{ id: string }>> {
    const user = await requireAuth()
    const currentEmployee = await getCurrentEmployeeForUser(user.id)
    if (!currentEmployee) return fail('Không tìm thấy hồ sơ nhân viên')

    // Calculate total days (business days)
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (end < start) return fail('Ngày kết thúc phải sau ngày bắt đầu')

    let totalDays = 0
    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        if (day !== 0 && day !== 6) totalDays++ // Skip weekends
        current.setDate(current.getDate() + 1)
    }
    if (totalDays === 0) return fail('Ngày nghỉ không hợp lệ (rơi vào cuối tuần)')

    // Check balance
    const year = start.getFullYear()
    const balances = await getLeaveBalances(currentEmployee.id, year)
    const balance = balances.find(b => b.leaveTypeId === input.leaveTypeId)
    if (balance && totalDays > balance.remainingDays) {
        return fail(`Số ngày phép còn lại không đủ (còn ${balance.remainingDays} ngày)`)
    }

    const id = `lr-${Date.now()}`
    const { error } = await db.from('leave_requests').insert({
        id,
        employeeId: currentEmployee.id,
        leaveTypeId: input.leaveTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalDays,
        reason: input.reason || null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    })

    if (error) return fail(error.message)

    await logAudit({
        userId: user.id,
        action: 'create',
        entity: 'leave_request',
        entityId: id,
        details: `Tạo đơn nghỉ phép ${totalDays} ngày (${input.startDate} → ${input.endDate})`,
    })

    return ok({ id })
}

/**
 * Approve a leave request and update balance.
 */
export async function approveLeaveRequest(requestId: string): Promise<ActionResult<void>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) {
        return fail('Chỉ quản lý mới có thể duyệt đơn nghỉ phép')
    }

    const { data: request } = await db.from('leave_requests').select('*').eq('id', requestId).single()
    if (!request) return fail('Không tìm thấy đơn nghỉ phép')
    if (request.status !== 'PENDING') return fail('Đơn này đã được xử lý')

    // Update request status
    const { error: updateError } = await db.from('leave_requests').update({
        status: 'APPROVED',
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
    }).eq('id', requestId)

    if (updateError) return fail(updateError.message)

    // Update leave balance
    const year = new Date(request.startDate).getFullYear()
    const { data: balance } = await db
        .from('leave_balances')
        .select('id, usedDays')
        .eq('employeeId', request.employeeId)
        .eq('leaveTypeId', request.leaveTypeId)
        .eq('year', year)
        .single()

    if (balance) {
        await db.from('leave_balances').update({
            usedDays: Number(balance.usedDays || 0) + Number(request.totalDays),
        }).eq('id', balance.id)
    }

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'leave_request',
        entityId: requestId,
        details: `Duyệt đơn nghỉ phép (${request.totalDays} ngày)`,
    })

    return ok(undefined as void)
}

/**
 * Reject a leave request.
 */
export async function rejectLeaveRequest(requestId: string): Promise<ActionResult<void>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) {
        return fail('Chỉ quản lý mới có thể từ chối đơn nghỉ phép')
    }

    const { data: request } = await db.from('leave_requests').select('status').eq('id', requestId).single()
    if (!request) return fail('Không tìm thấy đơn nghỉ phép')
    if (request.status !== 'PENDING') return fail('Đơn này đã được xử lý')

    const { error } = await db.from('leave_requests').update({
        status: 'REJECTED',
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
    }).eq('id', requestId)

    if (error) return fail(error.message)

    await logAudit({
        userId: user.id,
        action: 'update',
        entity: 'leave_request',
        entityId: requestId,
        details: 'Từ chối đơn nghỉ phép',
    })

    return ok(undefined as void)
}

/**
 * Get all employees' leave overview for a given year (manager view).
 */
export async function getLeaveOverview(year: number): Promise<Array<{
    employeeId: string
    name: string
    department: string
    balances: LeaveBalance[]
    pendingRequests: number
}>> {
    const user = await requireAuth()
    if (!MANAGER_ROLES.includes(user.role)) return []

    const { data: employees } = await supabase.from('employees').select('id, userId, department')
    const { data: users } = await supabase.from('users').select('id, name')
    const leaveTypes = await getLeaveTypes()

    const { data: allBalances } = await db.from('leave_balances').select('*').eq('year', year)
    const { data: allRequests } = await db
        .from('leave_requests')
        .select('employeeId, status')
        .gte('startDate', `${year}-01-01`)
        .lte('startDate', `${year}-12-31`)
        .eq('status', 'PENDING')

    const result = []
    for (const emp of (employees || [])) {
        const u = (users || []).find(u => u.id === emp.userId)
        const empBalances = (allBalances || [])
            .filter((b: Record<string, unknown>) => b.employeeId === emp.id)
            .map((b: Record<string, unknown>) => {
                const lt = leaveTypes.find(t => t.id === b.leaveTypeId)
                return {
                    id: b.id as string,
                    employeeId: b.employeeId as string,
                    leaveTypeId: b.leaveTypeId as string,
                    leaveTypeName: lt?.name || '—',
                    year: Number(b.year),
                    totalDays: Number(b.totalDays || 0),
                    usedDays: Number(b.usedDays || 0),
                    remainingDays: Number(b.totalDays || 0) - Number(b.usedDays || 0),
                }
            })

        const pendingCount = (allRequests || []).filter(
            (r: Record<string, unknown>) => r.employeeId === emp.id
        ).length

        result.push({
            employeeId: emp.id,
            name: u?.name || '—',
            department: (emp as Record<string, unknown>).department as string || '—',
            balances: empBalances,
            pendingRequests: pendingCount,
        })
    }

    return result.sort((a, b) => b.pendingRequests - a.pendingRequests)
}
