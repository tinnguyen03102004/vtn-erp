'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission, requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createLeadSchema, updateLeadSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function getStages() {
    const { data } = await supabase.from('crm_stages').select('*').order('sequence')
    return data || []
}

export async function getLeads() {
    const { data } = await supabase.from('crm_leads').select('*').order('createdAt', { ascending: false })
    return data || []
}

export async function getLeadsByStage() {
    const { data: stages } = await supabase.from('crm_stages').select('*').order('sequence')
    const { data: leads } = await supabase.from('crm_leads').select('*')

    return (stages || []).map((stage) => ({
        ...stage,
        leads: (leads || []).filter((l) => l.stageId === stage.id),
    }))
}

export async function getLead(id: string) {
    const { data } = await supabase.from('crm_leads').select('*').eq('id', id).single()
    return data
}

export async function createLead(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('crm.edit')
    const parsed = parseInput(createLeadSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('crm_leads').insert(parsed.data).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'lead', entityId: data.id, details: `Tạo lead: ${data.name}` })
    return ok(data)
}

export async function updateLead(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('crm.edit')
    const parsed = parseInput(updateLeadSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('crm_leads').update(parsed.data).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'lead', entityId: id })
    return ok(data)
}

export async function deleteLead(id: string): Promise<ActionResult<void>> {
    const user = await requirePermission('crm.edit')
    const { error } = await supabase.from('crm_leads').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'lead', entityId: id })
    return ok(undefined as void)
}

export async function moveLeadStage(leadId: string, stageId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('crm.edit')
    const { data: stage } = await supabase.from('crm_stages').select('probability').eq('id', stageId).single()
    const { data, error } = await supabase
        .from('crm_leads')
        .update({ stageId, probability: stage?.probability ?? 0, updatedAt: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'lead', entityId: leadId, details: `Di chuyển sang stage ${stageId}` })
    return ok(data)
}

export async function convertLeadToOrder(leadId: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('crm.edit')
    const lead = await getLead(leadId)
    if (!lead) return fail('Lead không tồn tại')

    const orderName = `SO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    const { data: order, error } = await supabase
        .from('sale_orders')
        .insert({
            name: orderName,
            leadId: lead.id,
            partnerName: lead.partnerName,
            partnerEmail: lead.email,
            partnerPhone: lead.phone,
            state: 'DRAFT',
            totalAmount: Number(lead.expectedValue || 0),
        })
        .select()
        .single()

    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'convert', entity: 'lead', entityId: leadId, details: `Convert → order ${order.id}` })
    return ok(order)
}
