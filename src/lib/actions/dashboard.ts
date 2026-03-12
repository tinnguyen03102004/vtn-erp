'use server'

import { supabase } from '@/lib/supabase'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { unstable_cache } from 'next/cache'

interface DashboardKPIs {
    activeProjects: number
    pendingInvoices: number
    totalEmployees: number
    totalLeads: number
}

async function fetchDashboardKPIs(): Promise<ActionResult<DashboardKPIs>> {
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

export const getDashboardKPIs = unstable_cache(
    fetchDashboardKPIs,
    ['dashboard-kpis'],
    { revalidate: 300 }
)

interface RecentProject {
    id: string
    code: string
    name: string
    state: string
    partnerName: string
}

async function fetchRecentProjects(): Promise<ActionResult<RecentProject[]>> {
    const { data, error } = await supabase
        .from('projects')
        .select('id, code, name, state, partnerName')
        .order('createdAt', { ascending: false })
        .limit(5)
    if (error) return fail(error.message)
    return ok((data || []) as RecentProject[])
}

export const getRecentProjects = unstable_cache(
    fetchRecentProjects,
    ['dashboard-recent-projects'],
    { revalidate: 120 }
)

interface RecentLead {
    id: string
    name: string
    partnerName: string
    expectedValue: number
    probability: number
    source: string
}

async function fetchRecentLeads(): Promise<ActionResult<RecentLead[]>> {
    const { data, error } = await supabase
        .from('crm_leads')
        .select('id, name, partnerName, expectedValue, probability, source')
        .order('createdAt', { ascending: false })
        .limit(5)
    if (error) return fail(error.message)
    return ok((data || []) as RecentLead[])
}

export const getRecentLeads = unstable_cache(
    fetchRecentLeads,
    ['dashboard-recent-leads'],
    { revalidate: 120 }
)

interface RevenuePoint { month: string; revenue: number }
interface ProjectStatusPoint { name: string; value: number; color: string }
interface ChartData { revenueData: RevenuePoint[]; projectStatusData: ProjectStatusPoint[] }

async function fetchChartData(): Promise<ActionResult<ChartData>> {
    const { data: payments, error: payErr } = await supabase.from('payments').select('amount, paymentDate').order('paymentDate')
    if (payErr) return fail(payErr.message)

    const monthlyRevenue: Record<string, number> = {}
    for (const p of payments || []) {
        const month = 'T' + new Date(String(p.paymentDate)).toLocaleString('vi-VN', { month: 'numeric' })
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount || 0)
    }
    const revenueData = Object.entries(monthlyRevenue).slice(-6).map(([month, revenue]) => ({
        month, revenue: Math.round(revenue / 1000000),
    }))

    const { data: projects, error: projErr } = await supabase.from('projects').select('state')
    if (projErr) return fail(projErr.message)

    const statusCounts: Record<string, number> = {}
    for (const p of projects || []) { statusCounts[p.state] = (statusCounts[p.state] || 0) + 1 }
    const statusMap: Record<string, { label: string; color: string }> = {
        ACTIVE: { label: '\u0110ang ch\u1EA1y', color: '#1F3A5F' },
        PAUSED: { label: 'T\u1EA1m d\u1EEBng', color: '#F59E0B' },
        DONE: { label: 'Ho\u00E0n th\u00E0nh', color: '#22C55E' },
        CANCELLED: { label: 'Hu\u1EF7', color: '#EF4444' },
        DRAFT: { label: 'Nh\u00E1p', color: '#8FA3BF' },
    }
    const projectStatusData = Object.entries(statusCounts).map(([state, count]) => ({
        name: statusMap[state]?.label ?? state,
        value: count,
        color: statusMap[state]?.color ?? '#8FA3BF',
    }))

    return ok({ revenueData, projectStatusData })
}

export const getChartData = unstable_cache(
    fetchChartData,
    ['dashboard-chart-data'],
    { revalidate: 600 }
)