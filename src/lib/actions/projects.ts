'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createPhaseSchema, createTaskSchema, updatePhaseSchema, updateTaskSchema, projectStateSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/actions/notifications'
import { createLogger } from '@vtn/logger'

const log = createLogger({ module: 'project' })

/** Lightweight project lookup for dropdowns/selectors — no phases/users join */
export async function getActiveProjectOptions() {
    await requirePermission('project.view')
    const { data } = await supabase
        .from('projects')
        .select('id, name, code, state')
        .in('state', ['ACTIVE', 'DRAFT'])
        .order('name')
    return (data || []).map((p) => ({ id: p.id, name: p.name as string, code: p.code as string, state: p.state as string }))
}

export async function getProjects() {
    await requirePermission('project.view')
    const [{ data: projects }, { data: phases }, { data: users }] = await Promise.all([
        supabase
            .from('projects')
            .select('id, code, name, state, partnerName, managerId, budget, createdAt')
            .order('createdAt', { ascending: false }),
        supabase.from('project_phases').select('id, projectId, state'),
        supabase.from('users').select('id, name'),
    ])

    return (projects || []).map((p) => ({
        ...p,
        phases: (phases || []).filter((ph) => ph.projectId === p.id),
        manager: (users || []).find((u) => u.id === p.managerId) || null,
    }))
}

export async function getProject(id: string) {
    await requirePermission('project.view')
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
    if (!project) return null

    const [phasesRes, tasksRes, invoicesRes, timesheetsRes, managerRes] = await Promise.all([
        supabase.from('project_phases').select('*').eq('projectId', id).order('sequence'),
        supabase.from('project_tasks').select('*').eq('projectId', id),
        supabase.from('invoices').select('*').eq('projectId', id),
        supabase.from('timesheets').select('*').eq('projectId', id),
        supabase.from('users').select('id, name, email').eq('id', project.managerId ?? '').single(),
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
    const stateResult = projectStateSchema.safeParse(state)
    if (!stateResult.success) return fail(`Trạng thái không hợp lệ: ${state}`)
    const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('projects').update({ state: stateResult.data, updatedAt: new Date().toISOString() } as any).eq('id', id).select().single()
    if (error) return fail(error.message)

    log.info('Project state changed', { projectId: id, state: stateResult.data })
    await logAudit({ userId: user.id, action: 'update', entity: 'project', entityId: id, details: `Trạng thái → ${stateResult.data}` })
    return ok(data)
}

// ── Phases ──
export async function createPhase(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const parsed = parseInput(createPhaseSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from('project_phases').insert(parsed.data as any).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'project_phase', entityId: data.id, details: `Tạo giai đoạn: ${data.name}` })
    return ok(data)
}

export async function updatePhase(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const parsed = parseInput(updatePhaseSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    const { data, error } = await supabase.from('project_phases').update(parsed.data as Record<string, unknown>).eq('id', id).select().single()
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from('project_tasks').insert(parsed.data as any).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'create', entity: 'project_task', entityId: data.id, details: `Tạo task: ${data.name}` })

    // Notify assignee
    if (data.assignedToId && data.assignedToId !== user.id) {
        createNotification({
            userId: data.assignedToId as string,
            type: 'task',
            title: `Bạn được giao task mới: ${data.name}`,
            message: `Được giao bởi ${user.name}`,
            link: `/projects`,
        }).catch(() => { /* fire and forget */ })
    }

    return ok(data)
}

export async function updateTask(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('project.edit')
    const parsed = parseInput(updateTaskSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    const { data, error } = await supabase
        .from('project_tasks').update({ ...parsed.data, updatedAt: new Date().toISOString() }).eq('id', id).select().single()
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
