'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createPayrollPeriodSchema, updateEmployeeSalarySchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import { createLogger } from '@vtn/logger'
import { calculateInsurance, calculatePit, formatVnd, type Region } from '@vtn/vietnam'

const log = createLogger({ module: 'payroll' })

// Supabase types haven't been regenerated for payroll tables yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ── Payroll Periods ──
export async function getPayrollPeriods() {
    await requirePermission('finance.view')
    const { data } = await db
        .from('payroll_periods')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
    return data || []
}

export async function getPayrollPeriod(id: string) {
    await requirePermission('finance.view')
    const { data: period } = await db.from('payroll_periods').select('*').eq('id', id).single()
    if (!period) return null

    const { data: slips } = await db
        .from('payroll_slips')
        .select('*')
        .eq('periodId', id)
        .order('createdAt')

    // Enrich slips with employee info
    const { data: employees } = await supabase.from('employees').select('id, userId, department, position')
    const { data: users } = await supabase.from('users').select('id, name, email')

    const enrichedSlips = (slips || []).map((slip: Record<string, unknown>) => {
        const emp = (employees || []).find((e: Record<string, unknown>) => e.id === slip.employeeId)
        const user = emp ? (users || []).find((u: Record<string, unknown>) => u.id === emp.userId) : null
        return {
            ...slip,
            employee: emp ? { ...emp, user } : null,
        }
    })

    return { ...period, slips: enrichedSlips }
}

// ── Create Payroll Period ──
export async function createPayrollPeriod(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')
    const parsed = parseInput(createPayrollPeriodSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    // Check duplicate
    const { data: existing } = await db
        .from('payroll_periods')
        .select('id')
        .eq('month', parsed.data.month)
        .eq('year', parsed.data.year)
        .single()
    if (existing) return fail(`Kỳ lương tháng ${parsed.data.month}/${parsed.data.year} đã tồn tại`)

    const { data, error } = await db
        .from('payroll_periods')
        .insert({
            month: parsed.data.month,
            year: parsed.data.year,
            notes: parsed.data.notes || null,
            state: 'DRAFT',
        })
        .select().single()
    if (error) return fail(error.message)

    log.info('Payroll period created', { periodId: data.id, month: parsed.data.month, year: parsed.data.year })
    await logAudit({ userId: user.id, action: 'create', entity: 'payroll_period', entityId: data.id, details: `Tạo kỳ lương T${parsed.data.month}/${parsed.data.year}` })
    return ok(data)
}

// ── Generate Payroll Slips (CORE) ──
export async function generatePayrollSlips(periodId: string): Promise<ActionResult<{ count: number }>> {
    const user = await requirePermission('finance.edit')

    // Get period
    const { data: period } = await db.from('payroll_periods').select('*').eq('id', periodId).single()
    if (!period) return fail('Kỳ lương không tồn tại')
    if (period.state !== 'DRAFT') return fail('Chỉ có thể tạo phiếu lương cho kỳ lương Nháp')

    // Delete existing slips
    await db.from('payroll_slips').delete().eq('periodId', periodId)

    // Get all employees with salary > 0
    const { data: employees } = await supabase.from('employees').select('*')
    const { data: users } = await supabase.from('users').select('id, name, isActive')
    const activeEmployees = (employees || []).filter((emp: Record<string, unknown>) => {
        const u = (users || []).find((u: Record<string, unknown>) => u.id === emp.userId)
        return u && u.isActive !== false && Number(emp.baseSalary || 0) > 0
    })

    if (activeEmployees.length === 0) return fail('Không có nhân viên nào có lương để tính')

    // Generate slips
    const slips = activeEmployees.map((emp: Record<string, unknown>) => {
        const gross = Number(emp.baseSalary || 0)
        const insurableSalary = Number(emp.insurableSalary || gross)
        const region = (emp.region || 1) as Region
        const dependents = Number(emp.dependents || 0)
        const allowances = Number(emp.allowances || 0)

        // 1. Insurance calculation
        const insurance = calculateInsurance({ insurableSalary, region })

        // 2. PIT calculation
        const taxableIncome = gross + allowances - insurance.employee.total
        const pit = calculatePit({ taxableIncome, dependents })

        // 3. Total deductions & net
        const totalDeductions = insurance.employee.total + pit.taxAmount
        const netSalary = gross + allowances - totalDeductions

        return {
            periodId,
            employeeId: emp.id,
            grossSalary: gross,
            bhxhEmployee: insurance.employee.socialInsurance,
            bhytEmployee: insurance.employee.healthInsurance,
            bhtnEmployee: insurance.employee.unemploymentInsurance,
            totalInsuranceEmployee: insurance.employee.total,
            bhxhEmployer: insurance.employer.socialInsurance,
            bhytEmployer: insurance.employer.healthInsurance,
            bhtnEmployer: insurance.employer.unemploymentInsurance,
            totalInsuranceEmployer: insurance.employer.total,
            taxableIncome,
            assessableIncome: pit.assessableIncome,
            dependents,
            pitAmount: pit.taxAmount,
            allowances,
            totalDeductions,
            netSalary: Math.max(0, netSalary),
        }
    })

    const { error } = await db.from('payroll_slips').insert(slips)
    if (error) return fail(`Tạo phiếu lương thất bại: ${error.message}`)

    // Update period totals
    const totalGross = slips.reduce((s, sl) => s + sl.grossSalary, 0)
    const totalDeductionsSum = slips.reduce((s, sl) => s + sl.totalDeductions, 0)
    const totalNet = slips.reduce((s, sl) => s + sl.netSalary, 0)

    await db.from('payroll_periods').update({
        totalGross,
        totalDeductions: totalDeductionsSum,
        totalNet,
        slipCount: slips.length,
        updatedAt: new Date().toISOString(),
    }).eq('id', periodId)

    log.info('Payroll slips generated', {
        periodId,
        count: slips.length,
        totalGross: formatVnd(totalGross),
        totalNet: formatVnd(totalNet),
    })

    await logAudit({ userId: user.id, action: 'generate', entity: 'payroll_slips', entityId: periodId, details: `Tạo ${slips.length} phiếu lương` })
    return ok({ count: slips.length })
}

// ── Confirm Payroll ──
export async function confirmPayroll(periodId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')

    const { data: period } = await db.from('payroll_periods').select('*').eq('id', periodId).single()
    if (!period) return fail('Kỳ lương không tồn tại')
    if (period.state !== 'DRAFT') return fail('Chỉ có thể xác nhận kỳ lương Nháp')
    if (Number(period.slipCount) === 0) return fail('Chưa có phiếu lương nào')

    const { data, error } = await db.from('payroll_periods').update({
        state: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
        confirmedById: user.id,
        updatedAt: new Date().toISOString(),
    }).eq('id', periodId).select().single()
    if (error) return fail(error.message)

    log.info('Payroll confirmed', { periodId, slipCount: period.slipCount })
    await logAudit({ userId: user.id, action: 'confirm', entity: 'payroll_period', entityId: periodId, details: `Xác nhận kỳ lương` })
    return ok(data)
}

// ── Delete Payroll Period ──
export async function deletePayrollPeriod(periodId: string): Promise<ActionResult<void>> {
    const user = await requirePermission('finance.edit')

    const { data: period } = await db.from('payroll_periods').select('state').eq('id', periodId).single()
    if (!period) return fail('Kỳ lương không tồn tại')
    if (period.state !== 'DRAFT') return fail('Chỉ có thể xóa kỳ lương Nháp')

    await db.from('payroll_slips').delete().eq('periodId', periodId)
    const { error } = await db.from('payroll_periods').delete().eq('id', periodId)
    if (error) return fail(error.message)

    log.info('Payroll period deleted', { periodId })
    await logAudit({ userId: user.id, action: 'delete', entity: 'payroll_period', entityId: periodId })
    return ok(undefined as void)
}

// ── Update Employee Salary ──
export async function updateEmployeeSalary(employeeId: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('hr.edit')
    const parsed = parseInput(updateEmployeeSalarySchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await db.from('employees').update({
        baseSalary: parsed.data.baseSalary,
        insurableSalary: parsed.data.insurableSalary || parsed.data.baseSalary,
        region: parsed.data.region || 1,
        updatedAt: new Date().toISOString(),
    }).eq('id', employeeId).select().single()
    if (error) return fail(error.message)

    log.info('Employee salary updated', { employeeId, salary: formatVnd(parsed.data.baseSalary) })
    await logAudit({ userId: user.id, action: 'update', entity: 'employee_salary', entityId: employeeId, details: `Cập nhật lương: ${formatVnd(parsed.data.baseSalary)}` })
    return ok(data)
}
