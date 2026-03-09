// ================================================================
// Server-Side Zod Validation Schemas for VTN-ERP
// ================================================================
import { z } from 'zod'

// ── CRM ──
export const createLeadSchema = z.object({
    name: z.string().min(1, 'Tên lead là bắt buộc'),
    contactName: z.string().optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().optional(),
    expectedRevenue: z.coerce.number().min(0, 'Doanh thu phải >= 0').optional(),
    stageId: z.string().uuid('Stage ID không hợp lệ').optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial()

// ── Sale Orders ──
export const createOrderSchema = z.object({
    partnerName: z.string().min(1, 'Tên khách hàng là bắt buộc'),
    partnerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    partnerPhone: z.string().optional(),
    leadId: z.string().uuid().optional().nullable(),
    notes: z.string().optional(),
})

export const updateOrderSchema = createOrderSchema.partial()

export const orderLineSchema = z.object({
    description: z.string().min(1, 'Mô tả hạng mục là bắt buộc'),
    qty: z.coerce.number().min(1, 'Số lượng phải >= 1'),
    unitPrice: z.coerce.number().min(0, 'Đơn giá phải >= 0'),
})

export const milestoneSchema = z.object({
    name: z.string().min(1, 'Tên mốc là bắt buộc'),
    percent: z.coerce.number().min(0).max(100, '% phải từ 0-100'),
    dueDate: z.string().optional(),
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
    method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD']).optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
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
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

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

export const createTaskSchema = z.object({
    phaseId: z.string().uuid(),
    name: z.string().min(1, 'Tên công việc là bắt buộc'),
    assigneeId: z.string().uuid().optional().nullable(),
    deadline: z.string().optional(),
})

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

// ── Direct Invoice (no milestone) ──
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
