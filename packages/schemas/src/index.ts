// ================================================================
// @vtn/schemas — Zod validation schemas for all VTN-ERP modules
// ================================================================
import { z } from 'zod'

// ── CRM ──
export const createLeadSchema = z.object({
    name: z.string().min(1, 'Tên lead là bắt buộc'),
    partnerName: z.string().min(1, 'Tên đối tác là bắt buộc'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().optional(),
    expectedValue: z.coerce.number().min(0, 'Giá trị phải >= 0').optional(),
    probability: z.coerce.number().min(0).max(100).optional(),
    stageId: z.string().uuid('Stage ID không hợp lệ').optional().or(z.literal('').transform(() => undefined)).or(z.null().transform(() => undefined)),
    source: z.string().optional(),
    notes: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial()

// ── Sale Orders ──
export const createOrderSchema = z.object({
    name: z.string().optional(),
    partnerName: z.string().min(1, 'Tên khách hàng là bắt buộc'),
    partnerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    partnerPhone: z.string().optional(),
    partnerAddress: z.string().optional(),
    partnerTaxCode: z.string().optional(),
    totalAmount: z.coerce.number().min(0).optional(),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    vatRate: z.coerce.number().min(0).max(100).optional(),
    validityDate: z.string().optional(),
    leadId: z.string().uuid().optional().nullable(),
    notes: z.string().optional(),
})

export const updateOrderSchema = createOrderSchema.partial()

export const orderLineSchema = z.object({
    description: z.string().min(1, 'Mô tả hạng mục là bắt buộc'),
    qty: z.coerce.number().min(0.01, 'Số lượng phải > 0'),
    unit: z.string().optional(),
    unitPrice: z.coerce.number().min(0, 'Đơn giá phải >= 0'),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
    vatRate: z.coerce.number().min(0).max(100).optional(),
})

export const milestoneSchema = z.object({
    orderId: z.string().min(1).optional(),
    name: z.string().min(1, 'Tên mốc là bắt buộc'),
    percent: z.coerce.number().min(0).max(100, '% phải từ 0-100'),
    amount: z.coerce.number().min(0).optional(),
    dueDate: z.string().optional().nullable(),
    state: z.string().optional(),
    invoiceId: z.string().uuid().optional().nullable(),
    sequence: z.coerce.number().min(0).optional(),
})

// ── Finance ──
export const createInvoiceSchema = z.object({
    orderId: z.string().uuid('Đơn hàng không hợp lệ'),
    milestoneId: z.string().uuid().optional().nullable(),
    amount: z.coerce.number().min(0, 'Số tiền phải >= 0'),
    dueDate: z.string().min(1, 'Ngày đến hạn là bắt buộc'),
    notes: z.string().optional(),
})

export const createPaymentSchema = z.object({
    invoiceId: z.string().uuid('Hóa đơn không hợp lệ'),
    amount: z.coerce.number().min(1, 'Số tiền phải > 0'),
    paymentDate: z.string().min(1, 'Ngày thanh toán là bắt buộc'),
    method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD']).optional(),
    reference: z.string().optional(),
    note: z.string().optional(),
})

export const directInvoiceSchema = z.object({
    partnerName: z.string().min(1, 'Tên khách hàng là bắt buộc'),
    partnerAddress: z.string().optional(),
    partnerTaxId: z.string().optional(),
    amountUntaxed: z.coerce.number().min(0, 'Số tiền phải >= 0'),
    amountTotal: z.coerce.number().min(0, 'Tổng tiền phải >= 0'),
    projectId: z.string().uuid().optional().nullable(),
    milestoneId: z.string().uuid().optional().nullable(),
    invoiceDate: z.string().min(1, 'Ngày lập hóa đơn là bắt buộc'),
    dueDate: z.string().optional(),
    description: z.string().optional(),
})

// ── Employees ──
export const createEmployeeSchema = z.object({
    name: z.string().min(1, 'Tên nhân viên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    role: z.string().optional(),
    password: z.string().min(6, 'Mật khẩu phải >= 6 ký tự').optional().or(z.literal('')),
    department: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    joinDate: z.string().optional(),
    machineCode: z.string().optional(),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

// ── Payroll ──
export const createPayrollPeriodSchema = z.object({
    month: z.coerce.number().min(1).max(12, 'Tháng phải từ 1-12'),
    year: z.coerce.number().min(2020).max(2099),
    notes: z.string().optional(),
})

export const updateEmployeeSalarySchema = z.object({
    baseSalary: z.coerce.number().min(0, 'Lương phải >= 0'),
    insurableSalary: z.coerce.number().min(0).optional(),
    region: z.coerce.number().min(1).max(4).optional(),
    dependents: z.coerce.number().min(0).max(10).optional(),
})

// ── Timesheets ──
export const timesheetEntrySchema = z.object({
    projectId: z.string().uuid('Dự án không hợp lệ'),
    date: z.string().min(1, 'Ngày là bắt buộc'),
    hours: z.coerce.number().min(0).max(24, 'Giờ phải từ 0-24'),
    description: z.string().optional(),
})

// ── Projects ──
export const createPhaseSchema = z.object({
    projectId: z.string().uuid(),
    name: z.string().min(1, 'Tên giai đoạn là bắt buộc'),
    sequence: z.coerce.number().min(0).optional(),
})

export const updatePhaseSchema = z.object({
    name: z.string().min(1).optional(),
    sequence: z.coerce.number().min(0).optional(),
    state: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
})

export const createTaskSchema = z.object({
    projectId: z.string().uuid('Dự án không hợp lệ'),
    phaseId: z.string().uuid(),
    name: z.string().min(1, 'Tên công việc là bắt buộc'),
    assigneeId: z.string().uuid().optional().nullable(),
    deadline: z.string().optional(),
})

export const updateTaskSchema = z.object({
    name: z.string().min(1).optional(),
    assignedToId: z.string().uuid().optional().nullable(),
    deadline: z.string().optional().nullable(),
    state: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
})

// ── State enums ──
export const projectStateSchema = z.enum(['DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
export const invoiceStateSchema = z.enum(['DRAFT', 'POSTED', 'PAID', 'CANCELLED'])
export const milestoneStateSchema = z.enum(['PENDING', 'INVOICED', 'PAID'])

// ── Settings ──
export const settingsSchema = z.record(z.string(), z.string())

// ── Users ──
export const createUserSchema = z.object({
    name: z.string().min(1, 'Tên là bắt buộc'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải >= 6 ký tự').optional().or(z.literal('')),
    role: z.enum(['DIRECTOR', 'PROJECT_MANAGER', 'ARCHITECT', 'FINANCE', 'SALES']).optional(),
})

export const updateUserSchema = createUserSchema.partial().extend({
    isActive: z.boolean().optional(),
})

// ── Helper: parse & return ActionResult-compatible errors ──
export function parseInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string; fieldErrors: Record<string, string> } {
    const result = schema.safeParse(data)
    if (result.success) return { success: true, data: result.data }

    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    const firstError = result.error.issues[0]?.message || 'Dữ liệu không hợp lệ'
    return { success: false, error: firstError, fieldErrors }
}
