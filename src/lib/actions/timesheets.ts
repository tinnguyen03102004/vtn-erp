'use server'

import { supabase } from '@/lib/supabase'

export async function getTimesheets(filters?: { employeeId?: string; projectId?: string; startDate?: string; endDate?: string }) {
    let query = supabase.from('timesheets').select('*').order('date', { ascending: false })

    if (filters?.employeeId) query = query.eq('employeeId', filters.employeeId)
    if (filters?.projectId) query = query.eq('projectId', filters.projectId)
    if (filters?.startDate) query = query.gte('date', filters.startDate)
    if (filters?.endDate) query = query.lte('date', filters.endDate)

    const { data } = await query

    // Join project info
    const { data: projects } = await supabase.from('projects').select('id, name')
    return (data || []).map((t: any) => ({
        ...t,
        project: (projects || []).find((p: any) => p.id === t.projectId) || null,
    }))
}

export async function saveWeekTimesheets(employeeId: string, entries: { projectId: string; date: string; hours: number }[]) {
    // Delete existing entries for the dates and re-insert
    const dates = [...new Set(entries.map(e => e.date))]
    if (dates.length > 0) {
        for (const date of dates) {
            await supabase.from('timesheets').delete().eq('employeeId', employeeId).eq('date', date)
        }
    }

    // Insert only non-zero entries
    const rows = entries.filter(e => e.hours > 0).map(e => ({
        employeeId,
        projectId: e.projectId,
        date: e.date,
        hours: e.hours,
    }))

    if (rows.length > 0) {
        const { error } = await supabase.from('timesheets').insert(rows)
        if (error) throw new Error(error.message)
    }
}

export async function getTimesheetsWithDetails() {
    const { data: timesheets } = await supabase.from('timesheets').select('*').order('date', { ascending: false })
    const { data: employees } = await supabase.from('employees').select('id, userId')
    const { data: users } = await supabase.from('users').select('id, name')
    const { data: projects } = await supabase.from('projects').select('id, name')

    return (timesheets || []).map((ts: any) => {
        const emp = (employees || []).find((e: any) => e.id === ts.employeeId)
        const user = emp ? (users || []).find((u: any) => u.id === emp.userId) : null
        const project = (projects || []).find((p: any) => p.id === ts.projectId)
        return { ...ts, userName: user?.name ?? '—', projectName: project?.name ?? '—' }
    })
}

export async function getWeekTimesheets(employeeId: string, weekStart: string) {
    const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employeeId', employeeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date')

    return data || []
}

export async function createTimesheet(formData: any) {
    const { data, error } = await supabase.from('timesheets').insert(formData).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateTimesheet(id: string, formData: any) {
    const { data, error } = await supabase
        .from('timesheets')
        .update({ ...formData, updatedAt: new Date().toISOString() })
        .eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function deleteTimesheet(id: string) {
    const { error } = await supabase.from('timesheets').delete().eq('id', id)
    if (error) throw new Error(error.message)
}
