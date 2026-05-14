'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'

// Untyped client for fields not yet in generated Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface EmployeeCostDetail {
    employeeId: string
    employeeName: string
    department: string
    hours: number
    hourlyRate: number
    cost: number
}

export interface ProjectCostSummary {
    projectId: string
    projectName: string
    projectState: string
    totalHours: number
    totalCost: number
    employees: EmployeeCostDetail[]
}

export interface CostAllocationResult {
    projects: ProjectCostSummary[]
    grandTotalHours: number
    grandTotalCost: number
    period: { startDate: string; endDate: string; label: string }
}

/**
 * Aggregate timesheet data into project cost allocation report.
 * hourlyRate = baseSalary / (24 standard work days × 8 hours)
 */
export async function getProjectCostAllocation(
    year?: number,
    month?: number,
): Promise<CostAllocationResult> {
    await requirePermission('finance.view')

    const now = new Date()
    const targetYear = year ?? now.getFullYear()
    const targetMonth = month ?? (now.getMonth() + 1)

    // Date range for the target month
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
    const lastDay = new Date(targetYear, targetMonth, 0).getDate()
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`

    // Fetch all data in parallel
    const [timesheetsRes, employeesRes, usersRes, projectsRes] = await Promise.all([
        supabase
            .from('timesheets')
            .select('employeeId, projectId, hours, date')
            .gte('date', startDate)
            .lte('date', endDate),
        db.from('employees').select('id, userId, department, baseSalary'),
        supabase.from('users').select('id, name'),
        supabase.from('projects').select('id, name, state'),
    ])

    const timesheets = timesheetsRes.data || []
    const employees = employeesRes.data || []
    const users = usersRes.data || []
    const projects = projectsRes.data || []

    // Build employee lookup: id → { name, department, hourlyRate }
    const empLookup = new Map<string, { name: string; department: string; hourlyRate: number }>()
    for (const emp of employees) {
        const user = users.find((u: { id: string }) => u.id === emp.userId)
        const baseSalary = Number(emp.baseSalary || 0)
        // hourlyRate = baseSalary / (24 standard days × 8 hours)
        const hourlyRate = baseSalary > 0 ? Math.round(baseSalary / (24 * 8)) : 0
        empLookup.set(emp.id as string, {
            name: (user?.name as string) || 'Unknown',
            department: (emp.department as string) || '',
            hourlyRate,
        })
    }

    // Build project lookup
    const projLookup = new Map<string, { name: string; state: string }>()
    for (const p of projects) {
        projLookup.set(p.id, { name: p.name as string, state: (p.state as string) || 'DRAFT' })
    }

    // Aggregate: project → employee → hours
    const aggregation = new Map<string, Map<string, number>>()
    for (const ts of timesheets) {
        const pid = ts.projectId as string
        const eid = ts.employeeId as string
        const hours = Number(ts.hours || 0)
        if (!hours || !pid || !eid) continue

        if (!aggregation.has(pid)) aggregation.set(pid, new Map())
        const projMap = aggregation.get(pid)!
        projMap.set(eid, (projMap.get(eid) || 0) + hours)
    }

    // Build result
    const projectSummaries: ProjectCostSummary[] = []
    let grandTotalHours = 0
    let grandTotalCost = 0

    for (const [projectId, empMap] of aggregation) {
        const proj = projLookup.get(projectId)
        const employees: EmployeeCostDetail[] = []
        let projHours = 0
        let projCost = 0

        for (const [employeeId, hours] of empMap) {
            const emp = empLookup.get(employeeId)
            const hourlyRate = emp?.hourlyRate || 0
            const cost = hours * hourlyRate

            employees.push({
                employeeId,
                employeeName: emp?.name || 'Unknown',
                department: emp?.department || '',
                hours,
                hourlyRate,
                cost,
            })

            projHours += hours
            projCost += cost
        }

        // Sort by cost desc
        employees.sort((a, b) => b.cost - a.cost)

        projectSummaries.push({
            projectId,
            projectName: proj?.name || 'Unknown',
            projectState: proj?.state || 'DRAFT',
            totalHours: projHours,
            totalCost: projCost,
            employees,
        })

        grandTotalHours += projHours
        grandTotalCost += projCost
    }

    // Sort projects by cost desc
    projectSummaries.sort((a, b) => b.totalCost - a.totalCost)

    const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

    return {
        projects: projectSummaries,
        grandTotalHours,
        grandTotalCost,
        period: {
            startDate,
            endDate,
            label: `${monthNames[targetMonth]} ${targetYear}`,
        },
    }
}
