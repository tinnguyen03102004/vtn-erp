'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'

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

    return (stages || []).map((stage: any) => ({
        ...stage,
        leads: (leads || []).filter((l: any) => l.stageId === stage.id),
    }))
}

export async function getLead(id: string) {
    const { data } = await supabase.from('crm_leads').select('*').eq('id', id).single()
    return data
}

export async function createLead(formData: any) {
    await requirePermission('crm.edit')
    const { data, error } = await supabase.from('crm_leads').insert(formData).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateLead(id: string, formData: any) {
    await requirePermission('crm.edit')
    const { data, error } = await supabase.from('crm_leads').update(formData).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function deleteLead(id: string) {
    await requirePermission('crm.edit')
    const { error } = await supabase.from('crm_leads').delete().eq('id', id)
    if (error) throw new Error(error.message)
}

export async function moveLeadStage(leadId: string, stageId: string) {
    await requirePermission('crm.edit')
    // Get stage probability
    const { data: stage } = await supabase.from('crm_stages').select('probability').eq('id', stageId).single()
    const { data, error } = await supabase
        .from('crm_leads')
        .update({ stageId, probability: stage?.probability ?? 0, updatedAt: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single()
    if (error) throw new Error(error.message)
    return data
}

export async function convertLeadToOrder(leadId: string) {
    await requirePermission('crm.edit')
    const lead = await getLead(leadId)
    if (!lead) throw new Error('Lead not found')

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

    if (error) throw new Error(error.message)
    return order
}
