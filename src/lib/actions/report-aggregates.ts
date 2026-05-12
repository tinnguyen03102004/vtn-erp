'use server'

import { supabase } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

/**
 * Lightweight aggregate data for the Reports page.
 * Instead of calling 5 heavy module actions (getProjects, getInvoices, getEmployees,
 * getLeadsByStage, getPayrollPeriods), this fetches only the aggregate KPIs needed.
 */

export interface ReportAggregates {
    // Projects
    projectsByState: Record<string, number>
    totalProjects: number
    // Invoices
    totalRevenue: number
    totalPending: number
    invoicesByState: Record<string, { count: number; amount: number }>
    // Employees
    totalEmployees: number
    // CRM
    stagesWithCounts: Array<{ id: string; name: string; sequence: number; leadCount: number; totalValue: number }>
    leadsBySource: Record<string, number>
    // Payroll
    latestPayrollNet: number
    latestPayrollMonth: string
}

async function fetchReportAggregates(): Promise<ReportAggregates> {
    const [projectsRes, invoicesRes, employeesRes, stagesRes, leadsRes, payrollRes] = await Promise.all([
        supabase.from('projects').select('state'),
        supabase.from('invoices').select('state, amountTotal'),
        supabase.from('employees').select('id', { count: 'exact' }),
        supabase.from('crm_stages').select('id, name, sequence').order('sequence'),
        supabase.from('crm_leads').select('stageId, expectedValue, source'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('payroll_periods').select('totalNet, year, month, state')
            .in('state', ['CONFIRMED', 'PAID'])
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(1),
    ])

    // Projects by state
    const projectsByState: Record<string, number> = {}
    for (const p of projectsRes.data || []) {
        const s = (p.state as string) || 'DRAFT'
        projectsByState[s] = (projectsByState[s] || 0) + 1
    }

    // Invoices aggregation
    const invoicesByState: Record<string, { count: number; amount: number }> = {}
    let totalRevenue = 0
    let totalPending = 0
    for (const inv of invoicesRes.data || []) {
        const s = (inv.state as string) || 'DRAFT'
        const amt = Number(inv.amountTotal || 0)
        if (!invoicesByState[s]) invoicesByState[s] = { count: 0, amount: 0 }
        invoicesByState[s].count++
        invoicesByState[s].amount += amt
        if (s === 'PAID') totalRevenue += amt
        if (s === 'POSTED') totalPending += amt
    }

    // CRM stages with lead counts
    const stagesData = stagesRes.data || []
    const leadsData = leadsRes.data || []
    const leadsBySource: Record<string, number> = {}
    const stageLeadCounts: Record<string, { count: number; value: number }> = {}

    for (const lead of leadsData) {
        const sid = lead.stageId as string
        if (!stageLeadCounts[sid]) stageLeadCounts[sid] = { count: 0, value: 0 }
        stageLeadCounts[sid].count++
        stageLeadCounts[sid].value += Number(lead.expectedValue || 0)

        const src = (lead.source as string) || 'Khác'
        leadsBySource[src] = (leadsBySource[src] || 0) + 1
    }

    const stagesWithCounts = stagesData.map((s) => ({
        id: s.id as string,
        name: s.name as string,
        sequence: s.sequence as number,
        leadCount: stageLeadCounts[s.id as string]?.count || 0,
        totalValue: stageLeadCounts[s.id as string]?.value || 0,
    }))

    // Payroll
    const latestPayroll = payrollRes?.data?.[0]

    return {
        projectsByState,
        totalProjects: (projectsRes.data || []).length,
        totalRevenue,
        totalPending,
        invoicesByState,
        totalEmployees: employeesRes.count || 0,
        stagesWithCounts,
        leadsBySource,
        latestPayrollNet: Number(latestPayroll?.totalNet || 0),
        latestPayrollMonth: latestPayroll ? `${latestPayroll.month}/${latestPayroll.year}` : '',
    }
}

export const getReportAggregates = unstable_cache(
    fetchReportAggregates,
    ['report-aggregates'],
    { revalidate: 300 }
)
