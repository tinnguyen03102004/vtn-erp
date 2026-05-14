'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createOrderSchema, updateOrderSchema, orderLineSchema, milestoneSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import { createLogger } from '@vtn/logger'
import { formatVnd, calculateVat } from '@vtn/vietnam'
import type { OrderLineInput, MilestoneInput } from '@/lib/types'

const log = createLogger({ module: 'sale' })

// ── Helpers ──

/** Recalculate order totals from lines, then apply order-level discount + VAT */
async function recalcOrderTotals(orderId: string) {
    const { data: lines } = await supabase.from('sale_order_lines').select('*').eq('orderId', orderId)
    const { data: order } = await supabase.from('sale_orders').select('discountPercent, vatRate').eq('id', orderId).single()
    if (!order) return

    // Sum line subtotals (each line already has its own discount applied)
    const totalAmount = (lines || []).reduce((s: number, l: Record<string, unknown>) => s + Number(l.subtotal || 0), 0)

    const discountPct = Number(order.discountPercent || 0)
    const discountAmount = Math.round(totalAmount * discountPct / 100)
    const afterDiscount = totalAmount - discountAmount

    const vatRate = Number(order.vatRate ?? 10) as 0 | 5 | 8 | 10
    const vat = calculateVat(afterDiscount, vatRate)
    const grandTotal = afterDiscount + vat.vatAmount

    await supabase.from('sale_orders').update({
        totalAmount,
        discountAmount,
        vatAmount: vat.vatAmount,
        grandTotal,
        updatedAt: new Date().toISOString(),
    }).eq('id', orderId)
}

/** Calculate single line subtotal with per-line discount */
function calcLineSubtotal(qty: number, unitPrice: number, discountPercent: number = 0): number {
    const raw = qty * unitPrice
    return Math.round(raw * (1 - discountPercent / 100))
}

// ── CRM Contacts for Quotation picker ──
export async function getCrmContacts() {
    await requirePermission('sale.view')
    const { data } = await supabase
        .from('crm_leads')
        .select('id, name, partnerName, email, phone')
        .order('createdAt', { ascending: false })
    return data || []
}

// ── Quotations ──
export async function getQuotations() {
    await requirePermission('sale.view')
    const { data: orders } = await supabase
        .from('sale_orders')
        .select('id, name, partnerName, state, totalAmount, grandTotal, createdAt, sentAt, approvedAt, docType, revision')
        .eq('docType', 'QUOTATION')
        .order('createdAt', { ascending: false })

    return orders || []
}

// ── Contracts ──
export async function getContracts() {
    await requirePermission('sale.view')
    const { data: orders } = await supabase
        .from('sale_orders')
        .select('id, name, partnerName, state, totalAmount, grandTotal, createdAt, signedAt, docType')
        .eq('docType', 'CONTRACT')
        .order('createdAt', { ascending: false })

    if (!orders || orders.length === 0) return []

    // Filter milestones by visible contract IDs only
    const contractIds = orders.map((o) => o.id)
    const { data: milestones } = await supabase
        .from('sale_milestones')
        .select('orderId')
        .in('orderId', contractIds)

    // Build count map
    const countMap: Record<string, number> = {}
    for (const m of milestones || []) {
        const oid = m.orderId as string
        countMap[oid] = (countMap[oid] || 0) + 1
    }

    return orders.map((order) => ({
        ...order,
        _count: { milestones: countMap[order.id] || 0 },
    }))
}

// ── All orders ──
export async function getOrders() {
    await requirePermission('sale.view')
    const [{ data: orders }, { data: milestones }] = await Promise.all([
        supabase.from('sale_orders').select('*').order('createdAt', { ascending: false }),
        supabase.from('sale_milestones').select('orderId'),
    ])

    return (orders || []).map((order: Record<string, unknown>) => ({
        ...order,
        _count: {
            milestones: (milestones || []).filter((m: Record<string, unknown>) => m.orderId === order.id).length,
        },
    }))
}

export async function getOrder(id: string) {
    await requirePermission('sale.view')
    const { data: order } = await supabase.from('sale_orders').select('*').eq('id', id).single()
    if (!order) return null

    const [{ data: lines }, { data: milestones }] = await Promise.all([
        supabase.from('sale_order_lines').select('*').eq('orderId', id).order('sequence'),
        supabase.from('sale_milestones').select('*').eq('orderId', id).order('sequence'),
    ])

    // Fetch optional linked entities in parallel
    const [quotation, lead] = await Promise.all([
        order.quotationId
            ? supabase.from('sale_orders').select('id, name, partnerName, totalAmount, state').eq('id', order.quotationId).single().then(r => r.data)
            : Promise.resolve(null),
        order.leadId
            ? supabase.from('crm_leads').select('id, name, partnerName, email, phone').eq('id', order.leadId).single().then(r => r.data)
            : Promise.resolve(null),
    ])

    return { ...order, lines: lines || [], milestones: milestones || [], quotation, lead }
}

// ── Create (always starts as Quotation-DRAFT) ──
export async function createOrder(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const parsed = parseInput(createOrderSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const orderName = parsed.data.name || `BG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

    // Calculate totals with VAT
    const totalAmount = Number(parsed.data.totalAmount || 0)
    const discountPct = Number(parsed.data.discountPercent || 0)
    const discountAmt = Math.round(totalAmount * discountPct / 100)
    const afterDiscount = totalAmount - discountAmt
    const vatRate = Number(parsed.data.vatRate ?? 10) as 0 | 5 | 8 | 10
    const vat = calculateVat(afterDiscount, vatRate)

    const { data, error } = await supabase.from('sale_orders').insert({
        ...parsed.data,
        name: orderName,
        docType: 'QUOTATION',
        state: 'DRAFT',
        discountAmount: discountAmt,
        vatAmount: vat.vatAmount,
        grandTotal: afterDiscount + vat.vatAmount,
        revision: 1,
        createdById: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    if (error) return fail(error.message)

    log.info('Quotation created', { orderId: data.id, name: data.name, partner: parsed.data.partnerName })
    await logAudit({ userId: user.id, action: 'create', entity: 'sale_order', entityId: data.id, details: `Tạo báo giá: ${data.name}` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(data as any)
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

    // Recalc totals if discount or VAT changed
    if (parsed.data.discountPercent !== undefined || parsed.data.vatRate !== undefined) {
        await recalcOrderTotals(id)
    }

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

    await logAudit({ userId: user.id, action: 'send', entity: 'sale_order', entityId: id, details: 'Gửi báo giá cho CĐT' })
    return ok(data)
}

export async function approveQuotation(id: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.approve')
    const { data, error } = await supabase.from('sale_orders')
        .update({ state: 'APPROVED', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .eq('id', id).eq('docType', 'QUOTATION').select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'approve', entity: 'sale_order', entityId: id, details: 'CĐT duyệt báo giá' })
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

// ── Revision: Create new version of Quotation ──
export async function reviseQuotation(quotationId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('sale.edit')
    const { data: original } = await supabase.from('sale_orders').select('*').eq('id', quotationId).single()
    if (!original) return fail('Báo giá không tồn tại')

    const newRevision = (Number(original.revision) || 1) + 1
    const baseName = String(original.name).replace(/ v\d+$/, '')
    const newName = `${baseName} v${newRevision}`

    // Create new revision
    const { data: revised, error } = await supabase.from('sale_orders').insert({
        name: newName,
        docType: 'QUOTATION',
        state: 'DRAFT',
        quotationId: quotationId, // link to original
        leadId: original.leadId,
        partnerName: original.partnerName,
        partnerEmail: original.partnerEmail,
        partnerPhone: original.partnerPhone,
        partnerAddress: original.partnerAddress,
        partnerTaxCode: original.partnerTaxCode,
        totalAmount: original.totalAmount,
        discountPercent: original.discountPercent,
        discountAmount: original.discountAmount,
        vatRate: original.vatRate,
        vatAmount: original.vatAmount,
        grandTotal: original.grandTotal,
        notes: original.notes,
        revision: newRevision,
        createdById: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    if (error) return fail(error.message)

    // Copy lines
    const { data: lines } = await supabase.from('sale_order_lines').select('*').eq('orderId', quotationId)
    if (lines && lines.length > 0) {
        const newLines = lines.map((l: Record<string, unknown>) => ({
            orderId: revised.id,
            description: l.description,
            qty: l.qty,
            unit: l.unit,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            vatRate: l.vatRate,
            subtotal: l.subtotal,
            sequence: l.sequence,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('sale_order_lines').insert(newLines as any[])
    }

    // Mark original as superseded
    await supabase.from('sale_orders').update({ state: 'EXPIRED', updatedAt: new Date().toISOString() }).eq('id', quotationId)

    log.info('Quotation revised', { originalId: quotationId, revisedId: revised.id, revision: newRevision })
    await logAudit({ userId: user.id, action: 'create', entity: 'sale_order', entityId: revised.id, details: `Tạo phiên bản mới: ${newName} (từ ${original.name})` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(revised as any)
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
        partnerAddress: quotation.partnerAddress,
        partnerTaxCode: quotation.partnerTaxCode,
        totalAmount: quotation.totalAmount,
        discountPercent: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        vatRate: quotation.vatRate,
        vatAmount: quotation.vatAmount,
        grandTotal: quotation.grandTotal,
        notes: quotation.notes,
        createdById: user.id,
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
            unit: l.unit,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            vatRate: l.vatRate,
            subtotal: l.subtotal,
            sequence: l.sequence,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: lineErr } = await supabase.from('sale_order_lines').insert(newLines as any[])
        if (lineErr) {
            await supabase.from('sale_orders').delete().eq('id', contract.id)
            return fail(`Chuyển báo giá thất bại: ${lineErr.message}`)
        }
    }

    log.info('Quotation converted to contract', { quotationId, contractId: contract.id, name, amount: formatVnd(Number(quotation.totalAmount || 0)) })
    await logAudit({ userId: user.id, action: 'convert', entity: 'sale_order', entityId: quotationId, details: `Quotation → Contract ${contract.id}` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(contract as any)
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

// ── Order Lines (with per-line discount) ──
export async function saveOrderLines(orderId: string, lines: OrderLineInput[]): Promise<ActionResult<void>> {
    const user = await requirePermission('sale.edit')

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
            unit: l.unit || 'bộ',
            unitPrice: l.unitPrice || 0,
            discountPercent: l.discountPercent || 0,
            vatRate: l.vatRate ?? 10,
            subtotal: calcLineSubtotal(l.qty || 1, l.unitPrice || 0, l.discountPercent || 0),
            sequence: i,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('sale_order_lines').insert(rows as any[])
        if (error) return fail(error.message)
    }

    // Recalculate order totals
    await recalcOrderTotals(orderId)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(data as any)
}

export async function saveMilestones(orderId: string, milestones: MilestoneInput[]): Promise<ActionResult<void>> {
    const user = await requirePermission('sale.edit')

    for (const m of milestones) {
        const parsed = parseInput(milestoneSchema, m)
        if (!parsed.success) return fail(`Mốc "${m.name || ''}": ${parsed.error}`, parsed.fieldErrors)
    }

    await supabase.from('sale_milestones').delete().eq('orderId', orderId)
    if (milestones.length > 0) {
        const { data: order } = await supabase.from('sale_orders').select('grandTotal, totalAmount').eq('id', orderId).single()
        const total = Number(order?.grandTotal || order?.totalAmount || 0)
        const rows = milestones.map((m, i) => ({
            orderId,
            name: m.name,
            percent: m.percent || 0,
            amount: Math.round(total * (m.percent || 0) / 100),
            dueDate: m.dueDate || null,
            state: m.state || 'PENDING',
            invoiceId: m.invoiceId || null,
            sequence: i,
        }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from('sale_milestones').insert(rows as any[])
        if (error) return fail(error.message)
    }

    await logAudit({ userId: user.id, action: 'update', entity: 'sale_milestones', entityId: orderId, details: `Cập nhật ${milestones.length} mốc thanh toán` })
    return ok(undefined as void)
}

// ── Milestone → Invoice (auto-create invoice from milestone) ──
export async function createInvoiceFromMilestone(milestoneId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('finance.edit')

    const { data: milestone } = await supabase.from('sale_milestones').select('*').eq('id', milestoneId).single()
    if (!milestone) return fail('Mốc thanh toán không tồn tại')
    if (milestone.state === 'PAID') return fail('Mốc này đã được thanh toán')

    const { data: order } = await supabase.from('sale_orders').select('*').eq('id', milestone.orderId).single()
    if (!order) return fail('Đơn hàng không tồn tại')

    const amount = Number(milestone.amount || 0)
    const vatRate = Number(order.vatRate || 10) as 0 | 5 | 8 | 10
    const vat = calculateVat(amount, vatRate)

    // Create invoice
    const invName = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const { data: invoice, error } = await supabase.from('invoices').insert({
        name: invName,
        partnerName: order.partnerName,
        partnerAddress: order.partnerAddress,
        partnerTaxId: order.partnerTaxCode,
        amountUntaxed: amount,
        vatAmount: vat.vatAmount,
        amountTotal: amount + vat.vatAmount,
        state: 'DRAFT',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: milestone.dueDate || null,
        description: `${milestone.name} — ${order.name}`,
        milestoneId: milestoneId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any).select().single()
    if (error) return fail(error.message)

    // Link milestone to invoice
    await supabase.from('sale_milestones').update({
        invoiceId: invoice.id,
        state: 'INVOICED',
    }).eq('id', milestoneId)

    log.info('Invoice created from milestone', { milestoneId, invoiceId: invoice.id, amount: formatVnd(amount) })
    await logAudit({ userId: user.id, action: 'create', entity: 'invoice', entityId: invoice.id, details: `Tạo HĐ từ mốc: ${milestone.name} — ${formatVnd(amount)}` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(invoice as any)
}

// ── Convert Sale → Project ──
export async function convertOrderToProject(orderId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
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
            budget: order.grandTotal || order.totalAmount,
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
        await supabase.from('project_phases').insert(phases as any[])
    }

    log.info('Order converted to project', { orderId, projectId: project.id, code, budget: formatVnd(Number(order.grandTotal || order.totalAmount || 0)) })
    await logAudit({ userId: user.id, action: 'convert', entity: 'sale_order', entityId: orderId, details: `Order → Project ${project.id}` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ok(project as any)
}
