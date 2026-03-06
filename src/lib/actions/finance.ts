'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'

export async function getInvoices() {
    const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .order('createdAt', { ascending: false })

    const { data: projects } = await supabase.from('projects').select('id, name')

    return (invoices || []).map((inv: any) => ({
        ...inv,
        project: (projects || []).find((p: any) => p.id === inv.projectId) || null,
    }))
}

export async function getInvoice(id: string) {
    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
    if (!invoice) return null

    const [projectRes, paymentsRes] = await Promise.all([
        supabase.from('projects').select('id, name, code').eq('id', invoice.projectId).single(),
        supabase.from('payments').select('*').eq('invoiceId', id).order('paymentDate', { ascending: false }),
    ])

    return {
        ...invoice,
        project: projectRes.data,
        payments: paymentsRes.data || [],
    }
}

// ── Create Invoice ──
export async function createInvoice(formData: any) {
    await requirePermission('finance.edit')
    const name = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const { data, error } = await supabase
        .from('invoices')
        .insert({ ...formData, name, state: 'DRAFT' })
        .select().single()
    if (error) throw new Error(error.message)
    return data
}

// ── Invoice State ──
export async function updateInvoiceState(id: string, state: string) {
    await requirePermission('finance.edit')
    const { data, error } = await supabase
        .from('invoices').update({ state, updatedAt: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

// ── Payments ──
export async function createPayment(formData: any) {
    await requirePermission('finance.edit')
    const { data: payment, error } = await supabase.from('payments').insert(formData).select().single()
    if (error) throw new Error(error.message)

    // Check if invoice is fully paid
    const { data: payments } = await supabase.from('payments').select('amount').eq('invoiceId', formData.invoiceId)
    const { data: invoice } = await supabase.from('invoices').select('amountTotal').eq('id', formData.invoiceId).single()
    const totalPaid = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
    if (invoice && totalPaid >= Number(invoice.amountTotal)) {
        await supabase.from('invoices').update({ state: 'PAID', updatedAt: new Date().toISOString() }).eq('id', formData.invoiceId)
    }

    return payment
}

// ── Create from Milestone ──
export async function createInvoiceFromMilestone(milestoneId: string, projectId: string) {
    await requirePermission('finance.edit')
    const { data: milestone } = await supabase.from('sale_milestones').select('*').eq('id', milestoneId).single()
    if (!milestone) throw new Error('Milestone not found')

    const { data: project } = await supabase.from('projects').select('partnerName').eq('id', projectId).single()

    const invoice = await createInvoice({
        partnerName: project?.partnerName || 'N/A',
        amountUntaxed: milestone.amount,
        amountTotal: milestone.amount,
        projectId,
        milestoneId,
        invoiceDate: new Date().toISOString(),
        dueDate: milestone.dueDate,
    })

    // Mark milestone as invoiced
    await supabase.from('sale_milestones').update({ state: 'INVOICED' }).eq('id', milestoneId)

    return invoice
}
