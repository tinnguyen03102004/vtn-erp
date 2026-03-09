'use server'

import { supabase } from '@/lib/supabase'
import { ok, fail, type ActionResult } from '@/lib/action-result'

interface SearchResult {
    type: 'lead' | 'order' | 'project' | 'invoice' | 'employee'
    id: string
    title: string
    subtitle: string
    url: string
}

export async function globalSearch(query: string): Promise<ActionResult<SearchResult[]>> {
    if (!query || query.length < 2) return ok([])
    const q = `%${query}%`
    const results: SearchResult[] = []

    const [leads, orders, projects, invoices, employees] = await Promise.all([
        supabase.from('crm_leads').select('id, name, partnerName, expectedValue').ilike('name', q).limit(5),
        supabase.from('sale_orders').select('id, name, partnerName, totalAmount').ilike('name', q).limit(5),
        supabase.from('projects').select('id, name, code, partnerName').ilike('name', q).limit(5),
        supabase.from('invoices').select('id, name, partnerName, amountTotal').ilike('name', q).limit(5),
        supabase.from('users').select('id, name, email, role').ilike('name', q).limit(5),
    ])

    if (leads.error) return fail(leads.error.message)
    if (orders.error) return fail(orders.error.message)
    if (projects.error) return fail(projects.error.message)
    if (invoices.error) return fail(invoices.error.message)
    if (employees.error) return fail(employees.error.message)

    for (const l of leads.data || []) results.push({ type: 'lead', id: l.id, title: l.name, subtitle: l.partnerName || '—', url: `/crm/${l.id}` })
    for (const o of orders.data || []) results.push({ type: 'order', id: o.id, title: o.name, subtitle: o.partnerName || '—', url: `/sale/${o.id}` })
    for (const p of projects.data || []) results.push({ type: 'project', id: p.id, title: p.name, subtitle: p.code || '—', url: `/projects/${p.id}` })
    for (const i of invoices.data || []) results.push({ type: 'invoice', id: i.id, title: i.name, subtitle: i.partnerName || '—', url: `/finance/invoices/${i.id}` })
    for (const e of employees.data || []) results.push({ type: 'employee', id: e.id, title: e.name || '—', subtitle: e.email || '—', url: `/employees` })

    return ok(results.slice(0, 15))
}
