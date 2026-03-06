'use server'

import { supabase } from '@/lib/supabase'

export async function getDashboardKPIs() {
    const [projectsRes, invoicesRes, employeesRes, leadsRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('state', 'ACTIVE'),
        supabase.from('invoices').select('amountTotal').in('state', ['DRAFT', 'POSTED']),
        supabase.from('employees').select('id', { count: 'exact' }),
        supabase.from('crm_leads').select('id', { count: 'exact' }),
    ])

    const pendingAmount = (invoicesRes.data || []).reduce((s: number, i: any) => s + Number(i.amountTotal || 0), 0)

    return {
        activeProjects: projectsRes.count || 0,
        pendingInvoices: pendingAmount,
        totalEmployees: employeesRes.count || 0,
        totalLeads: leadsRes.count || 0,
    }
}

export async function getRecentProjects() {
    const { data } = await supabase
        .from('projects')
        .select('id, code, name, state, partnerName')
        .order('createdAt', { ascending: false })
        .limit(5)
    return data || []
}

export async function getRecentLeads() {
    const { data } = await supabase
        .from('crm_leads')
        .select('id, name, partnerName, expectedValue, probability, source')
        .order('createdAt', { ascending: false })
        .limit(5)
    return data || []
}

export async function getChartData() {
    // Revenue: invoices paid amounts by month
    const { data: payments } = await supabase.from('payments').select('amount, paymentDate').order('paymentDate')
    const monthlyRevenue: Record<string, number> = {}
    for (const p of payments || []) {
        const month = 'T' + new Date(p.paymentDate).toLocaleString('vi-VN', { month: 'numeric' })
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount || 0)
    }
    const revenueData = Object.entries(monthlyRevenue).slice(-6).map(([month, revenue]) => ({
        month, revenue: Math.round(revenue / 1000000), // convert to triệu
    }))

    // Project status breakdown
    const { data: projects } = await supabase.from('projects').select('state')
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

    return { revenueData, projectStatusData }
}
