'use server'

import { supabase } from '@/lib/supabase'

export async function getProjects() {
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('createdAt', { ascending: false })

    const { data: phases } = await supabase.from('project_phases').select('id, projectId, state')
    const { data: users } = await supabase.from('users').select('id, name')

    return (projects || []).map((p: any) => ({
        ...p,
        phases: (phases || []).filter((ph: any) => ph.projectId === p.id),
        manager: (users || []).find((u: any) => u.id === p.managerId) || null,
    }))
}

export async function getProject(id: string) {
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
    if (!project) return null

    const [phasesRes, tasksRes, invoicesRes, timesheetsRes, managerRes] = await Promise.all([
        supabase.from('project_phases').select('*').eq('projectId', id).order('sequence'),
        supabase.from('project_tasks').select('*').eq('projectId', id),
        supabase.from('invoices').select('*').eq('projectId', id),
        supabase.from('timesheets').select('*').eq('projectId', id),
        supabase.from('users').select('id, name, email').eq('id', project.managerId).single(),
    ])

    return {
        ...project,
        phases: phasesRes.data || [],
        tasks: tasksRes.data || [],
        invoices: invoicesRes.data || [],
        timesheets: timesheetsRes.data || [],
        manager: managerRes.data,
    }
}

// ── Project State ──
export async function updateProjectState(id: string, state: string) {
    const { data, error } = await supabase
        .from('projects').update({ state, updatedAt: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

// ── Phases ──
export async function createPhase(formData: any) {
    const { data, error } = await supabase.from('project_phases').insert(formData).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updatePhase(id: string, formData: any) {
    const { data, error } = await supabase.from('project_phases').update(formData).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function deletePhase(id: string) {
    await supabase.from('project_tasks').delete().eq('phaseId', id)
    const { error } = await supabase.from('project_phases').delete().eq('id', id)
    if (error) throw new Error(error.message)
}

// ── Tasks ──
export async function createTask(formData: any) {
    const { data, error } = await supabase.from('project_tasks').insert(formData).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateTask(id: string, formData: any) {
    const { data, error } = await supabase
        .from('project_tasks').update({ ...formData, updatedAt: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return data
}

export async function deleteTask(id: string) {
    const { error } = await supabase.from('project_tasks').delete().eq('id', id)
    if (error) throw new Error(error.message)
}
