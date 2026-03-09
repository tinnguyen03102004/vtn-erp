'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createPhaseSchema, createTaskSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function getProjects() {
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .order('createdAt', { ascending: false })

    const { data: phases } = await supabase.from('project_phases').select('id, projectId, state')
    const { data: users } = await supabase.from('users').select('id, name')

    return (projects || []).map((p) => ({
        ...p,
        phases: (phases || []).filter((ph) => ph.projectId === p.id),
        manager: (users || []).find((u) => u.id === p.managerId) || null,
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
export async function updateProjectState(id: string, state: string): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const { data, error } = await supabase
        .from('projects').update({ state, updatedAt: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'project', entityId: id, details: `Trạng thái → ${state}` })
    return ok(data)
}

// ── Phases ──
export async function createPhase(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const parsed = parseInput(createPhaseSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('project_phases').insert(parsed.data).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'project_phase', entityId: data.id, details: `Tạo giai đoạn: ${data.name}` })
    return ok(data)
}

export async function updatePhase(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const { data, error } = await supabase.from('project_phases').update(formData as Record<string, unknown>).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'project_phase', entityId: id })
    return ok(data)
}

export async function deletePhase(id: string): Promise<ActionResult<void>> {
    const user = await requirePermission('project.edit')
    await supabase.from('project_tasks').delete().eq('phaseId', id)
    const { error } = await supabase.from('project_phases').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'project_phase', entityId: id })
    return ok(undefined as void)
}

// ── Tasks ──
export async function createTask(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const parsed = parseInput(createTaskSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('project_tasks').insert(parsed.data).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'project_task', entityId: data.id, details: `Tạo task: ${data.name}` })
    return ok(data)
}

export async function updateTask(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const { data, error } = await supabase
        .from('project_tasks').update({ ...(formData as Record<string, unknown>), updatedAt: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'project_task', entityId: id })
    return ok(data)
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
    const user = await requirePermission('project.edit')
    const { error } = await supabase.from('project_tasks').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'delete', entity: 'project_task', entityId: id })
    return ok(undefined as void)
}
