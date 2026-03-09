'use server'

// ================================================================
// SHARED DTO TYPES for VTN-ERP Server Actions
// Provides type-safe interfaces for all mutation inputs.
// Read operations return Supabase-inferred types (good enough).
// ================================================================

// ── CRM ──

export interface CreateLeadInput {
    name: string
    partnerName?: string
    email?: string
    phone?: string
    source?: string
    expectedValue?: number
    stageId?: string
    assignedTo?: string
    note?: string
}

export type UpdateLeadInput = Partial<CreateLeadInput>

// ── Sale Orders (Quotations & Contracts) ──

export interface CreateOrderInput {
    partnerName: string
    partnerEmail?: string
    partnerPhone?: string
    partnerAddress?: string
    totalAmount?: number
    leadId?: string
    notes?: string
}

export type UpdateOrderInput = Partial<CreateOrderInput> & {
    state?: string
    sentAt?: string
    approvedAt?: string
    rejectedReason?: string
}

export interface OrderLineInput {
    id?: string
    orderId: string
    description: string
    qty: number
    unitPrice: number
    subtotal?: number
    sequence?: number
}

export interface MilestoneInput {
    id?: string
    orderId: string
    name: string
    percent: number
    amount?: number
    dueDate?: string
    state?: string
    sequence?: number
}

// ── Projects ──

export interface CreatePhaseInput {
    projectId: string
    name: string
    sequence?: number
    startDate?: string
    endDate?: string
    state?: string
}

export type UpdatePhaseInput = Partial<Omit<CreatePhaseInput, 'projectId'>>

export interface CreateTaskInput {
    projectId?: string
    phaseId: string
    name: string
    assigneeId?: string
    state?: string
    priority?: string
    deadline?: string
}

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, 'projectId'>>

// ── Finance ──

export interface CreateInvoiceInput {
    partnerName: string
    partnerAddress?: string
    partnerTaxId?: string
    amountUntaxed: number
    amountTotal: number
    projectId?: string
    milestoneId?: string
    invoiceDate: string
    dueDate?: string
    description?: string
}

export interface CreatePaymentInput {
    invoiceId: string
    amount: number
    paymentDate: string
    method: 'BANK' | 'CASH' | 'OTHER'
    note?: string
}

// ── HR / Employees ──

export interface CreateEmployeeInput {
    name: string
    email: string
    role?: string
    password?: string
    department?: string
    position?: string
    phone?: string
    joinDate?: string
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>

// ── Timesheets ──

export interface TimesheetEntry {
    projectId: string
    date: string
    hours: number
}

export interface CreateTimesheetInput {
    employeeId: string
    projectId: string
    date: string
    hours: number
    description?: string
    taskId?: string
}

export type UpdateTimesheetInput = Partial<Omit<CreateTimesheetInput, 'employeeId'>>
