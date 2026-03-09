'use server'

import { supabase } from '@/lib/supabase'
import { ok, fail, type ActionResult } from '@/lib/action-result'

interface DashboardKPIs {
    activeProjects: number
    pendingInvoices: number
    totalEmployees: number
    totalLeads: number
}

export async function getDashboardKPIs(): Promise<ActionResult<DashboardKPIs>> {
    const [projectsRes, invoicesRes, employeesRes, leadsRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('state', 'ACTIVE'),
        supabase.from('invoices').select('amountTotal').in('state', ['DRAFT', 'POSTED']),
        supabase.from('employees').select('id', { count: 'exact' }),
        supabase.from('crm_leads').select('id', { count: 'exact' }),
    ])

    if (projectsRes.error) return fail(projectsRes.error.message)
    if (invoicesRes.error) return fail(invoicesRes.error.message)
    if (employeesRes.error) return fail(employeesRes.error.message)
    if (leadsRes.error) return fail(leadsRes.error.message)

    const pendingAmount = (invoicesRes.data || []).reduce(
        (s: number, i: Record<string, unknown>) => s + Number(i.amountTotal || 0), 0
    )

    return ok({
        activeProjects: projectsRes.count || 0,
        pendingInvoices: pendingAmount,
        totalEmployees: employeesRes.count || 0,
        totalLeads: leadsRes.count || 0,
    })
}

interface RecentProject {
    id: string
    code: string
    name: string
    state: string
    partnerName: string
}

export async function getRecentProjects(): Promise<ActionResult<RecentProject[]>> {
    const { data, error } = await supabase
        .from('projects')
        .select('id, code, name, state, partnerName')
        .order('createdAt', { ascending: false })
        .limit(5)
    if (error) return fail(error.message)
    return ok((data || []) as RecentProject[])
}

interface RecentLead {
    id: string
    name: string
    partnerName: string
    expectedValue: number
    probability: number
    source: string
}

export async function getRecentLeads(): Promise<ActionResult<RecentLead[]>> {
    const { data, error } = await supabase
        .from('crm_leads')
        .select('id, name, partnerName, expectedValue, probability, source')
        .order('createdAt', { ascending: false })
        .limit(5)
    if (error) return fail(error.message)
    return ok((data || []) as RecentLead[])
}

interface RevenuePoint {
    month: string
    revenue: number
}

interface ProjectStatusPoint {
    name: string
    value: number
    color: string
}

interface ChartData {
    revenueData: RevenuePoint[]
    projectStatusData: ProjectStatusPoint[]
}

export async function getChartData(): Promise<ActionResult<ChartData>> {
    // Revenue: invoices paid amounts by month
    const { data: payments, error: payErr } = await supabase.from('payments').select('amount, paymentDate').order('paymentDate')
    if (payErr) return fail(payErr.message)

    const monthlyRevenue: Record<string, number> = {}
    for (const p of payments || []) {
        const month = 'T' + new Date(String(p.paymentDate)).toLocaleString('vi-VN', { month: 'numeric' })
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount || 0)
    }
    const revenueData = Object.entries(monthlyRevenue).slice(-6).map(([month, revenue]) => ({
        month, revenue: Math.round(revenue / 1000000), // convert to triệu
    }))

    // Project status breakdown
    const { data: projects, error: projErr } = await supabase.from('projects').select('state')
    if (projErr) return fail(projErr.message)

    const statusCounts: Record<string, number> = {}
    for (const p of projects || []) {
        statusCounts[p.state] = (statusCounts[p.state] || 0) + 1
    }
    const statusMap: Record<string, { label: string; color: string }> = {
        ACTIVE: { label: 'Đang chạy', color: '#1F3A5F' },
        PAUSED: { label: 'Tạm dừng', color: '#F59E0B' },
        DONE: { label: 'Hoàn thành', color: '#22C55E' },
        CANCELLED: { label: 'Huỷ', color: '#EF4444' },
        DRAFT: { label: 'Nháp', color: '#8FA3BF' },
    }
    const projectStatusData = Object.entries(statusCounts).map(([state, count]) => ({
        name: statusMap[state]?.label ?? state,
        value: count,
        color: statusMap[state]?.color ?? '#8FA3BF',
    }))

    return ok({ revenueData, projectStatusData })
}
