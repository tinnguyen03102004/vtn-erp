'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createOrderSchema, updateOrderSchema, orderLineSchema, milestoneSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import type { OrderLineInput, MilestoneInput } from '@/lib/types'

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

    return (orders || []).map((order) => ({
        ...order,
        _count: {
            milestones: (milestones || []).filter((m) => m.orderId === order.id).length,
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

    return (orders || []).map((order: Record<string, unknown>) => ({
        ...order,
        _count: {
            milestones: (milestones || []).filter((m: Record<string, unknown>) => m.orderId === order.id).length,
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
export async function createOrder(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const parsed = parseInput(createOrderSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('sale_orders').insert({ ...parsed.data,
        docType: 'QUOTATION',
        state: 'DRAFT',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'sale_order', entityId: data.id, details: `Tạo báo giá: ${data.name}` })
    return ok(data)
}

export async function updateOrder(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const parsed = parseInput(updateOrderSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase
        .from('sale_orders')
        .update({ ...parsed.data, updatedAt: new Date().toISOString() })
        .eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'sale_order', entityId: id })
    return ok(data)
}

export async function deleteOrder(id: string): Promise<ActionResult<void>> {
    const user = await requirePermission('sale.edit')
    await supabase.from('sale_order_lines').delete().eq('orderId', id)
    await supabase.from('sale_milestones').delete().eq('orderId', id)
    const { error } = await supabase.from('sale_orders').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'sale_order', entityId: id })
    return ok(undefined as void)
}

// ── Quotation State Transitions ──
export async function sendQuotation(id: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'SENT', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'send', entity: 'sale_order', entityId: id, details: 'Gửi báo giá' })
    return ok(data)
}

export async function approveQuotation(id: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.approve')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'APPROVED', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'approve', entity: 'sale_order', entityId: id, details: 'Duyệt báo giá' })
    return ok(data)
}

export async function rejectQuotation(id: string, reason?: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'REJECTED', rejectedReason: reason || '', updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'reject', entity: 'sale_order', entityId: id, details: `Từ chối: ${reason || ''}` })
    return ok(data)
}

// ── Convert Quotation → Contract ──
export async function convertToContract(quotationId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data: quotation } = await supabase.from('sale_orders').select('*').eq('id', quotationId).single()
    if (!quotation) return fail('Báo giá không tồn tại')

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    if (error) return fail(error.message)

    // Copy order lines (rollback contract on failure)
    const { data: lines } = await supabase.from('sale_order_lines').select('*').eq('orderId', quotationId)
    if (lines && lines.length > 0) {
        const newLines = lines.map((l: Record<string, unknown>) => ({
            orderId: contract.id,
            description: l.description,
            qty: l.qty,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal,
            sequence: l.sequence,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: lineErr } = await supabase.from('sale_order_lines').insert(newLines as any)
        if (lineErr) {
            // Compensating rollback: delete orphaned contract
            await supabase.from('sale_orders').delete().eq('id', contract.id)
            return fail(`Chuyển báo giá thất bại: ${lineErr.message}`)
        }
    }

    await logAudit({ userId: user.id, action: 'convert', entity: 'sale_order', entityId: quotationId, details: `Quotation → Contract ${contract.id}` })
    return ok(contract)
}

// ── Contract State Transitions ──
export async function signContract(id: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'SIGNED', signedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'CONTRACT').select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'sign', entity: 'sale_order', entityId: id, details: 'Ký hợp đồng' })
    return ok(data)
}

export async function updateOrderState(id: string, state: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const extra: Record<string, unknown> = { state, updatedAt: new Date().toISOString() }
    if (state === 'SIGNED') extra.signedAt = new Date().toISOString()
    if (state === 'SENT') extra.sentAt = new Date().toISOString()
    if (state === 'APPROVED') extra.approvedAt = new Date().toISOString()
    const { data, error } = await supabase.from('sale_orders').update(extra).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'sale_order', entityId: id, details: `Chuyển trạng thái → ${state}` })
    return ok(data)
}

// ── Order Lines ──
export async function saveOrderLines(orderId: string, lines: OrderLineInput[]): Promise<ActionResult<void>> {
    const user = await requirePermission('sale.edit')

    // Validate each line
    for (const line of lines) {
        const parsed = parseInput(orderLineSchema, line)
        if (!parsed.success) return fail(`Dòng "${line.description || ''}": ${parsed.error}`, parsed.fieldErrors)
    }

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('sale_order_lines').insert(rows as any)
        if (error) return fail(error.message)
    }
    const total = lines.reduce((s, l) => s + (l.qty || 1) * (l.unitPrice || 0), 0)
    await supabase.from('sale_orders').update({ totalAmount: total, updatedAt: new Date().toISOString() }).eq('id', orderId)

    await logAudit({ userId: user.id, action: 'update', entity: 'sale_order_lines', entityId: orderId, details: `Cập nhật ${lines.length} dòng dịch vụ` })
    return ok(undefined as void)
}

// ── Milestones ──
export async function addMilestone(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const parsed = parseInput(milestoneSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from('sale_milestones').insert(parsed.data as any).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'sale_milestone', entityId: data.id, details: `Thêm mốc: ${data.name}` })
    return ok(data)
}

export async function saveMilestones(orderId: string, milestones: MilestoneInput[]): Promise<ActionResult<void>> {
    const user = await requirePermission('sale.edit')

    // Validate each milestone
    for (const m of milestones) {
        const parsed = parseInput(milestoneSchema, m)
        if (!parsed.success) return fail(`Mốc "${m.name || ''}": ${parsed.error}`, parsed.fieldErrors)
    }

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('sale_milestones').insert(rows as any)
        if (error) return fail(error.message)
    }

    await logAudit({ userId: user.id, action: 'update', entity: 'sale_milestones', entityId: orderId, details: `Cập nhật ${milestones.length} mốc thanh toán` })
    return ok(undefined as void)
}

// ── Convert Sale → Project ──
export async function convertOrderToProject(orderId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data: order } = await supabase.from('sale_orders').select('*').eq('id', orderId).single()
    if (!order) return fail('Đơn hàng không tồn tại')

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

    if (error) return fail(error.message)

    const { data: orderMilestones } = await supabase.from('sale_milestones').select('*').eq('orderId', orderId).order('sequence')
    if (orderMilestones && orderMilestones.length > 0) {
        const phases = orderMilestones.map((m: Record<string, unknown>, i: number) => ({
            projectId: project.id,
            name: m.name,
            sequence: i,
            state: 'TODO',
            milestoneId: m.id,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('project_phases').insert(phases as any)
    }

    await logAudit({ userId: user.id, action: 'convert', entity: 'sale_order', entityId: orderId, details: `Order → Project ${project.id}` })
    return ok(project)
}
