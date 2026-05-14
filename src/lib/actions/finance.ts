'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createPaymentSchema, directInvoiceSchema, invoiceStateSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import { createLogger } from '@vtn/logger'
import { calculateVat } from '@vtn/vietnam'

const log = createLogger({ module: 'finance' })

export async function getInvoices() {
    await requirePermission('finance.view')
    const [{ data: invoices }, { data: projects }] = await Promise.all([
        supabase.from('invoices').select('id, name, partnerName, state, invoiceDate, dueDate, amountTotal, projectId, createdAt').order('createdAt', { ascending: false }),
        supabase.from('projects').select('id, name'),
    ])

    return (invoices || []).map((inv) => ({
        ...inv,
        project: (projects || []).find((p) => p.id === inv.projectId) || null,
    }))
}

export async function getInvoice(id: string) {
    await requirePermission('finance.view')
    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
    if (!invoice) return null

    const [projectRes, paymentsRes] = await Promise.all([
        supabase.from('projects').select('id, name, code').eq('id', invoice.projectId ?? '').single(),
        supabase.from('payments').select('*').eq('invoiceId', id).order('paymentDate', { ascending: false }),
    ])

    return {
        ...invoice,
        project: projectRes.data,
        payments: paymentsRes.data || [],
    }
}

// ── Create Invoice ──
export async function createInvoice(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')
    const parsed = parseInput(directInvoiceSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const name = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    // Calculate VAT (10% standard) if only amountUntaxed provided
    const amountUntaxed = Number(parsed.data.amountUntaxed || parsed.data.amountTotal || 0)
    const vat = calculateVat(amountUntaxed, 10)
    const { data, error } = await supabase
        .from('invoices')
        .insert({
            ...parsed.data,
            name,
            state: 'DRAFT',
            amountUntaxed: vat.amountUntaxed,
            amountTotal: parsed.data.amountTotal || vat.amountTotal,
        })
        .select().single()
    if (error) return fail(error.message)

    log.info('Invoice created', { invoiceId: data.id, name, amount: vat.amountTotal, vatRate: vat.vatRate })
    await logAudit({ userId: user.id, action: 'create', entity: 'invoice', entityId: data.id, details: `Tạo hóa đơn: ${name}` })
    return ok(data)
}

// ── Invoice State ──
export async function updateInvoiceState(id: string, state: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')
    const stateResult = invoiceStateSchema.safeParse(state)
    if (!stateResult.success) return fail(`Trạng thái không hợp lệ: ${state}`)
    const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('invoices').update({ state: stateResult.data, updatedAt: new Date().toISOString() } as any).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'invoice', entityId: id, details: `Chuyển trạng thái → ${stateResult.data}` })
    return ok(data)
}

// ── Payments ──
export async function createPayment(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')
    const parsed = parseInput(createPaymentSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payment, error } = await supabase.from('payments').insert(parsed.data as any).select().single()
    if (error) return fail(error.message)

    // Check if invoice is fully paid
    const [{ data: payments }, { data: invoice }] = await Promise.all([
        supabase.from('payments').select('amount').eq('invoiceId', parsed.data.invoiceId),
        supabase.from('invoices').select('amountTotal').eq('id', parsed.data.invoiceId).single(),
    ])
    const totalPaid = (payments || []).reduce((s: number, p: Record<string, unknown>) => s + Number(p.amount), 0)
    if (invoice && totalPaid >= Number(invoice.amountTotal)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('invoices').update({ state: 'PAID', updatedAt: new Date().toISOString() } as any).eq('id', parsed.data.invoiceId)
    }

    log.info('Payment recorded', { paymentId: payment.id, invoiceId: parsed.data.invoiceId, amount: parsed.data.amount })
    await logAudit({ userId: user.id, action: 'create', entity: 'payment', entityId: payment.id, details: `Thanh toán ${parsed.data.amount}` })
    return ok(payment)
}

// ── Create from Milestone ──
export async function createInvoiceFromMilestone(milestoneId: string, projectId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')
    const { data: milestone } = await supabase.from('sale_milestones').select('*').eq('id', milestoneId).single()
    if (!milestone) return fail('Milestone không tồn tại')

    const { data: project } = await supabase.from('projects').select('partnerName').eq('id', projectId).single()

    const invoiceData = {
        partnerName: project?.partnerName || 'N/A',
        amountUntaxed: milestone.amount,
        amountTotal: milestone.amount,
        projectId,
        milestoneId,
        invoiceDate: new Date().toISOString(),
        dueDate: milestone.dueDate,
    }

    const name = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const { data, error } = await supabase
        .from('invoices')
        .insert({ ...invoiceData, name, state: 'DRAFT' })
        .select().single()
    if (error) return fail(error.message)

    // Mark milestone as invoiced
    await supabase.from('sale_milestones').update({ state: 'INVOICED' }).eq('id', milestoneId)

    await logAudit({ userId: user.id, action: 'create', entity: 'invoice', entityId: data.id, details: `Invoice từ milestone ${milestoneId}` })
    return ok(data)
}
