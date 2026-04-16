'use server'

import { Prisma } from '@prisma/client'

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
    expectedRevenue?: number
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
    partnerTaxCode?: string
    totalAmount?: number
    discountPercent?: number
    discountAmount?: number
    vatRate?: number
    vatAmount?: number
    grandTotal?: number
    validityDate?: string
    leadId?: string
    notes?: string
}

export type UpdateOrderInput = Partial<CreateOrderInput> & {
    state?: string
    sentAt?: string
    approvedAt?: string
    rejectedReason?: string
    revision?: number
}

export interface OrderLineInput {
    id?: string
    orderId: string
    description: string
    qty: number | null
    unit?: string | null
    unitPrice: number | null
    discountPercent?: number | null
    vatRate?: number | null
    subtotal?: number | null
    sequence?: number | null
}

export interface MilestoneInput {
    id?: string
    orderId: string
    name: string
    percent: number | null
    amount?: number | null
    dueDate?: string | null
    state?: string | null
    invoiceId?: string | null
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

// === Prisma Payload Types ===

export type SaleOrderWithRelations = Prisma.SaleOrderGetPayload<{
    include: {
        lines: true
        milestones: true
        lead: true
        createdBy: true
        projects: true
        quotation: true
    }
}>

export type LeadWithStage = Prisma.CrmLeadGetPayload<{
    include: { stage: true; assignedTo: true }
}>

export type InvoiceWithPayments = Prisma.InvoiceGetPayload<{
    include: { payments: true; project: true; milestone: true }
}>

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        phases: { include: { tasks: true } }
        manager: true
        saleOrder: true
        invoices: true
        timesheets: true
    }
}>

export type EmployeeWithRole = Prisma.EmployeeGetPayload<{
    include: { user: true }
}>
