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
    const [{ data: projects }, { data: phases }, { data: users }, { data: timesheets }, { data: employees }] = await Promise.all([
        supabase
            .from('projects')
            .select('id, code, name, state, partnerName, managerId, budget, createdAt')
            .order('createdAt', { ascending: false }),
        supabase.from('project_phases').select('id, projectId, state'),
        supabase.from('users').select('id, name'),
        supabase.from('timesheets').select('projectId, employeeId, hours'),
        supabase.from('employees').select('id, userId'),
    ])

    // Aggregate timesheet stats per project
    const tsStats = new Map<string, { hours: number; members: Set<string> }>()
    for (const t of (timesheets || [])) {
        if (!t.projectId) continue
        if (!tsStats.has(t.projectId)) tsStats.set(t.projectId, { hours: 0, members: new Set() })
        const s = tsStats.get(t.projectId)!
        s.hours += Number(t.hours || 0)
        if (t.employeeId) s.members.add(t.employeeId)
    }

    // Map employeeId → user name
    const empUserMap = new Map<string, string>()
    for (const emp of (employees || [])) {
        const user = (users || []).find(u => u.id === emp.userId)
        if (user) empUserMap.set(emp.id, user.name as string)
    }

    return (projects || []).map((p) => {
        const stats = tsStats.get(p.id)
        return {
            ...p,
            phases: (phases || []).filter((ph) => ph.projectId === p.id),
            manager: (users || []).find((u) => u.id === p.managerId) || null,
            timesheetHours: stats ? Math.round(stats.hours) : 0,
            teamCount: stats ? stats.members.size : 0,
            teamNames: stats ? Array.from(stats.members).map(eid => empUserMap.get(eid) || '').filter(Boolean).slice(0, 4) : [],
        }
    })
}

export async function getProject(id: string) {
    await requirePermission('project.view')
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
    if (!project) return null

    const [phasesRes, tasksRes, invoicesRes, timesheetsRes, managerRes, employeesRes, usersRes] = await Promise.all([
        supabase.from('project_phases').select('*').eq('projectId', id).order('sequence'),
        supabase.from('project_tasks').select('*').eq('projectId', id),
        supabase.from('invoices').select('*').eq('projectId', id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('timesheets').select('employeeId, hours, date, phase' as any).eq('projectId', id) as any,
        supabase.from('users').select('id, name, email').eq('id', project.managerId ?? '').single(),
        supabase.from('employees').select('id, userId, department'),
        supabase.from('users').select('id, name'),
    ])

    // Build team members with timesheet breakdown
    const ts = timesheetsRes.data || []
    const empMap = new Map<string, { hours: number; phase: string | null; monthlyHours: Map<string, number> }>()
    for (const t of ts) {
        if (!t.employeeId) continue
        if (!empMap.has(t.employeeId)) empMap.set(t.employeeId, { hours: 0, phase: null, monthlyHours: new Map() })
        const entry = empMap.get(t.employeeId)!
        entry.hours += Number(t.hours || 0)
        if (t.phase) entry.phase = t.phase as string
        const monthKey = String(t.date).substring(0, 7) // YYYY-MM
        entry.monthlyHours.set(monthKey, (entry.monthlyHours.get(monthKey) || 0) + Number(t.hours || 0))
    }

    const employees = employeesRes.data || []
    const users = usersRes.data || []
    const teamMembers = Array.from(empMap.entries()).map(([empId, data]) => {
        const emp = employees.find(e => e.id === empId)
        const user = emp ? users.find(u => u.id === emp.userId) : null
        return {
            employeeId: empId,
            name: (user?.name as string) || '—',
            department: (emp?.department as string) || '—',
            totalHours: Math.round(data.hours),
            phase: data.phase,
            monthlyHours: Object.fromEntries(data.monthlyHours),
        }
    }).sort((a, b) => b.totalHours - a.totalHours)

    return {
        ...project,
        phases: phasesRes.data || [],
        tasks: tasksRes.data || [],
        invoices: invoicesRes.data || [],
        timesheets: ts,
        teamMembers,
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
