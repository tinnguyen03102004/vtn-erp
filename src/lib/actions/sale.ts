'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'

// ── Quotations ──
export async function getQuotations() {
    const { data: orders } = await supabase
        .from('sale_orders')
        .select('*')
        .eq('docType', 'QUOTATION')
        .order('createdAt', { ascending: false })

    return orders || []
}

// ── Contracts ──
export async function getContracts() {
    const { data: orders } = await supabase
        .from('sale_orders')
        .select('*')
        .eq('docType', 'CONTRACT')
        .order('createdAt', { ascending: false })

    const { data: milestones } = await supabase.from('sale_milestones').select('orderId')

    return (orders || []).map((order: any) => ({
        ...order,
        _count: {
            milestones: (milestones || []).filter((m: any) => m.orderId === order.id).length,
        },
    }))
}

// ── All orders (for backward compat) ──
export async function getOrders() {
    const { data: orders } = await supabase
        .from('sale_orders')
        .select('*')
        .order('createdAt', { ascending: false })

    const { data: milestones } = await supabase.from('sale_milestones').select('orderId')

    return (orders || []).map((order: any) => ({
        ...order,
        _count: {
            milestones: (milestones || []).filter((m: any) => m.orderId === order.id).length,
        },
    }))
}

export async function getOrder(id: string) {
    const { data: order } = await supabase.from('sale_orders').select('*').eq('id', id).single()
    if (!order) return null

    const { data: lines } = await supabase.from('sale_order_lines').select('*').eq('orderId', id).order('sequence')
    const { data: milestones } = await supabase.from('sale_milestones').select('*').eq('orderId', id).order('sequence')

    // If contract, fetch linked quotation
    let quotation = null
    if (order.quotationId) {
        const { data } = await supabase.from('sale_orders').select('id, name, partnerName, totalAmount, state').eq('id', order.quotationId).single()
        quotation = data
    }

    return { ...order, lines: lines || [], milestones: milestones || [], quotation }
}

// ── Create (always starts as Quotation-DRAFT) ──
export async function createOrder(formData: any) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders').insert({
        ...formData,
        docType: 'QUOTATION',
        state: 'DRAFT',
    }).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateOrder(id: string, formData: any) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase
        .from('sale_orders')
        .update({ ...formData, updatedAt: new Date().toISOString() })
        .eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function deleteOrder(id: string) {
    await requirePermission('sale.edit')
    await supabase.from('sale_order_lines').delete().eq('orderId', id)
    await supabase.from('sale_milestones').delete().eq('orderId', id)
    const { error } = await supabase.from('sale_orders').delete().eq('id', id)
    if (error) throw new Error(error.message)
}

// ── Quotation State Transitions ──
export async function sendQuotation(id: string) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'SENT', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function approveQuotation(id: string) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'APPROVED', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function rejectQuotation(id: string, reason?: string) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'REJECTED', rejectedReason: reason || '', updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) throw new Error(error.message)
    return data
}

// ── Convert Quotation → Contract ──
export async function convertToContract(quotationId: string) {
    await requirePermission('sale.edit')
    const { data: quotation } = await supabase.from('sale_orders').select('*').eq('id', quotationId).single()
    if (!quotation) throw new Error('Báo giá không tồn tại')

    const name = `HĐ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const { data: contract, error } = await supabase.from('sale_orders').insert({
        name,
        docType: 'CONTRACT',
        state: 'NEGOTIATING',
        quotationId,
        leadId: quotation.leadId,
        partnerName: quotation.partnerName,
        partnerEmail: quotation.partnerEmail,
        partnerPhone: quotation.partnerPhone,
        totalAmount: quotation.totalAmount,
        notes: quotation.notes,
        createdById: quotation.createdById,
    }).select().single()
    if (error) throw new Error(error.message)

    // Copy order lines
    const { data: lines } = await supabase.from('sale_order_lines').select('*').eq('orderId', quotationId)
    if (lines && lines.length > 0) {
        const newLines = lines.map((l: any) => ({
            orderId: contract.id,
            description: l.description,
            qty: l.qty,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal,
            sequence: l.sequence,
        }))
        await supabase.from('sale_order_lines').insert(newLines)
    }

    return contract
}

// ── Contract State Transitions ──
export async function signContract(id: string) {
    await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'SIGNED', signedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'CONTRACT').select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateOrderState(id: string, state: string) {
    await requirePermission('sale.edit')
    const extra: any = { state, updatedAt: new Date().toISOString() }
    if (state === 'SIGNED') extra.signedAt = new Date().toISOString()
    if (state === 'SENT') extra.sentAt = new Date().toISOString()
    if (state === 'APPROVED') extra.approvedAt = new Date().toISOString()
    const { data, error } = await supabase.from('sale_orders').update(extra).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

// ── Order Lines ──
export async function saveOrderLines(orderId: string, lines: any[]) {
    await supabase.from('sale_order_lines').delete().eq('orderId', orderId)
    if (lines.length > 0) {
        const rows = lines.map((l, i) => ({
            orderId,
            description: l.description,
            qty: l.qty || 1,
            unitPrice: l.unitPrice || 0,
            subtotal: (l.qty || 1) * (l.unitPrice || 0),
            sequence: i,
        }))
        const { error } = await supabase.from('sale_order_lines').insert(rows)
        if (error) throw new Error(error.message)
    }
    const total = lines.reduce((s, l) => s + (l.qty || 1) * (l.unitPrice || 0), 0)
    await supabase.from('sale_orders').update({ totalAmount: total, updatedAt: new Date().toISOString() }).eq('id', orderId)
}

// ── Milestones ──
export async function addMilestone(formData: any) {
    const { data, error } = await supabase.from('sale_milestones').insert(formData).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function saveMilestones(orderId: string, milestones: any[]) {
    await supabase.from('sale_milestones').delete().eq('orderId', orderId)
    if (milestones.length > 0) {
        const { data: order } = await supabase.from('sale_orders').select('totalAmount').eq('id', orderId).single()
        const total = Number(order?.totalAmount || 0)
        const rows = milestones.map((m, i) => ({
            orderId,
            name: m.name,
            percent: m.percent || 0,
            amount: Math.round(total * (m.percent || 0) / 100),
            dueDate: m.dueDate || null,
            state: m.state || 'PENDING',
            sequence: i,
        }))
        const { error } = await supabase.from('sale_milestones').insert(rows)
        if (error) throw new Error(error.message)
    }
}

// ── Convert Sale → Project ──
export async function convertOrderToProject(orderId: string) {
    const { data: order } = await supabase.from('sale_orders').select('*').eq('id', orderId).single()
    if (!order) throw new Error('Order not found')

    const code = `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name: `Dự án ${order.partnerName}`,
            code,
            saleOrderId: order.id,
            partnerName: order.partnerName,
            state: 'DRAFT',
            budget: order.totalAmount,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    const { data: milestones } = await supabase.from('sale_milestones').select('*').eq('orderId', orderId).order('sequence')
    if (milestones && milestones.length > 0) {
        const phases = milestones.map((m: any, i: number) => ({
            projectId: project.id,
            name: m.name,
            sequence: i,
            state: 'TODO',
            milestoneId: m.id,
        }))
        await supabase.from('project_phases').insert(phases)
    }

    return project
}
