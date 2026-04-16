'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    updateProjectState,
    createPhase,
    updatePhase,
    deletePhase,
    createTask,
    updateTask,
    deleteTask,
} from '@/lib/actions/projects'
import { useToast, ToastContainer } from '@/components/Toast'

interface ProjectPhase {
    id: string
    name: string
    state: string | null
    sequence: number | null
    projectId: string
}

interface ProjectTask {
    id: string
    name: string
    state: string | null
    priority: string | null
    phaseId: string | null
    projectId: string
}

interface ProjectTimesheet {
    hours: number | string | null
}

interface ProjectInvoice {
    id: string
    name: string | null
    state: string | null
    amountTotal: number | string | null
    invoiceDate?: string | null
}

interface ProjectData {
    id: string
    name: string
    code?: string | null
    state: string | null
    budget?: number | string | null
    partnerName?: string | null
    manager?: { name: string | null } | null
    managerId?: string | null
    phases?: ProjectPhase[]
    tasks?: ProjectTask[]
    timesheets?: ProjectTimesheet[]
    invoices?: ProjectInvoice[]
    [key: string]: unknown
}

const stateColors: Record<string, string> = {
    DRAFT: 'muted',
    ACTIVE: 'success',
    PAUSED: 'warning',
    DONE: 'primary',
    CANCELLED: 'danger',
}

const stateLabels: Record<string, string> = {
    DRAFT: 'Nhap',
    ACTIVE: 'Dang thuc hien',
    PAUSED: 'Tam dung',
    DONE: 'Hoan thanh',
    CANCELLED: 'Da huy',
}

const stateFlow: Record<string, { next: string; label: string }[]> = {
    DRAFT: [{ next: 'ACTIVE', label: 'Bat dau' }],
    ACTIVE: [
        { next: 'PAUSED', label: 'Tam dung' },
        { next: 'DONE', label: 'Hoan thanh' },
    ],
    PAUSED: [{ next: 'ACTIVE', label: 'Tiep tuc' }],
    DONE: [],
    CANCELLED: [{ next: 'DRAFT', label: 'Mo lai' }],
}

const phaseLabels: Record<string, string> = {
    TODO: 'Cho',
    IN_PROGRESS: 'Dang lam',
    DONE: 'Xong',
}

const taskLabels: Record<string, string> = {
    TODO: 'Cho',
    IN_PROGRESS: 'Dang lam',
    REVIEW: 'Review',
    DONE: 'Xong',
}

export default function ProjectDetail({
    project: initProject,
    canEditProject,
}: {
    project: ProjectData
    canEditProject: boolean
}) {
    const { toasts, addToast } = useToast()
    const [project, setProject] = useState(initProject)
    const [phases, setPhases] = useState(initProject.phases || [])
    const [tasks, setTasks] = useState(initProject.tasks || [])
    const [showAddPhase, setShowAddPhase] = useState(false)
    const [showAddTask, setShowAddTask] = useState<string | null>(null)

    const transitions = stateFlow[project.state ?? 'DRAFT'] || []
    const totalHours = (project.timesheets || []).reduce((sum: number, timesheet: ProjectTimesheet) => sum + Number(timesheet.hours || 0), 0)
    const doneCount = tasks.filter((task: ProjectTask) => task.state === 'DONE').length
    const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

    async function handleState(nextState: string) {
        try {
            const result = await updateProjectState(project.id, nextState)
            if ('success' in result && !result.success) {
                addToast(result.error || 'Loi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setProject((current: ProjectData) => ({ ...current, ...updated }))
            addToast(`Da chuyen sang "${stateLabels[nextState]}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handleAddPhase(formData: FormData) {
        const name = formData.get('name') as string
        if (!name) return

        try {
            const result = await createPhase({
                projectId: project.id,
                name,
                sequence: phases.length,
                state: 'TODO',
            })

            if ('success' in result && !result.success) {
                addToast(result.error || 'Loi', 'error')
                return
            }

            const phase = 'data' in result ? result.data : result
            setPhases((current: ProjectPhase[]) => [...current, phase as unknown as ProjectPhase])
            setShowAddPhase(false)
            addToast(`Da them phase "${name}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handlePhaseState(phaseId: string, state: string) {
        try {
            const result = await updatePhase(phaseId, { state })
            if ('success' in result && !result.success) {
                addToast(result.error || 'Loi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setPhases((current: ProjectPhase[]) => current.map((phase) => (
                phase.id === phaseId ? { ...phase, ...updated } : phase
            )))
            addToast(`Phase -> ${phaseLabels[state]}`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handleDeletePhase(phaseId: string) {
        if (!confirm('Xoa phase va tat ca tasks trong do?')) return

        try {
            await deletePhase(phaseId)
            setPhases((current: ProjectPhase[]) => current.filter((phase) => phase.id !== phaseId))
            setTasks((current: ProjectTask[]) => current.filter((task) => task.phaseId !== phaseId))
            addToast('Da xoa phase')
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handleAddTask(formData: FormData) {
        const name = formData.get('name') as string
        const phaseId = formData.get('phaseId') as string
        if (!name) return

        try {
            const result = await createTask({
                projectId: project.id,
                phaseId,
                name,
                state: 'TODO',
                priority: 'NORMAL',
            })

            if ('success' in result && !result.success) {
                addToast(result.error || 'Loi', 'error')
                return
            }

            const task = 'data' in result ? result.data : result
            setTasks((current: ProjectTask[]) => [...current, task as unknown as ProjectTask])
            setShowAddTask(null)
            addToast(`Da them task "${name}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handleTaskState(taskId: string, state: string) {
        try {
            const result = await updateTask(taskId, { state })
            if ('success' in result && !result.success) {
                addToast(result.error || 'Loi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setTasks((current: ProjectTask[]) => current.map((task) => (
                task.id === taskId ? { ...task, ...updated } : task
            )))
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    async function handleDeleteTask(taskId: string) {
        try {
            await deleteTask(taskId)
            setTasks((current: ProjectTask[]) => current.filter((task) => task.id !== taskId))
            addToast('Da xoa task')
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Loi', 'error')
        }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/projects" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Du an</Link>
                <span>&rsaquo;</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{project.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
                        <span className={`badge badge-${stateColors[project.state ?? 'DRAFT']}`}>{stateLabels[project.state ?? 'DRAFT']}</span>
                        {project.code && <span style={{ fontSize: 12, color: '#8FA3BF' }}>{project.code}</span>}
                    </div>
                    <p className="page-subtitle">{project.partnerName ?? project.manager?.name ?? '-'} | Budget: {formatCurrency(Number(project.budget ?? 0))}</p>
                </div>
                <div className="page-actions">
                    {canEditProject && transitions.map((transition) => (
                        <button
                            key={transition.next}
                            className="btn btn-primary btn-sm"
                            onClick={() => handleState(transition.next)}
                        >
                            {transition.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Tien do', value: `${progress}%`, icon: '1' },
                    { label: 'Tasks', value: `${doneCount}/${tasks.length}`, icon: '2' },
                    { label: 'Gio cong', value: `${totalHours}h`, icon: '3' },
                    { label: 'Hoa don', value: `${(project.invoices || []).length}`, icon: '4' },
                ].map((kpi) => (
                    <div key={kpi.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div className="kpi-label">{kpi.label}</div>
                                <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{kpi.value}</div>
                            </div>
                            <div style={{ fontSize: 24 }}>{kpi.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Giai doan va Cong viec</div>
                    {canEditProject && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPhase(true)}>+ Phase</button>
                    )}
                </div>

                {phases.length === 0 && !showAddPhase && (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                        {canEditProject ? 'Chua co phase. Nhan &quot;+ Phase&quot; de them.' : 'Chua co phase.'}
                    </div>
                )}

                {phases.map((phase: ProjectPhase) => {
                    const phaseTasks = tasks.filter((task: ProjectTask) => task.phaseId === phase.id)

                    return (
                        <div key={phase.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8F9FB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{phase.name}</span>
                                    {canEditProject ? (
                                        <select
                                            value={phase.state ?? 'TODO'}
                                            onChange={(event) => handlePhaseState(phase.id, event.target.value)}
                                            style={{ fontSize: 11, border: '1px solid #CBD5E1', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                                        >
                                            <option value="TODO">Cho</option>
                                            <option value="IN_PROGRESS">Dang lam</option>
                                            <option value="DONE">Xong</option>
                                        </select>
                                    ) : (
                                        <span className="badge badge-muted">{phaseLabels[phase.state ?? ''] ?? phase.state}</span>
                                    )}
                                </div>

                                {canEditProject && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAddTask(phase.id)}>+ Task</button>
                                        <button
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}
                                            onClick={() => handleDeletePhase(phase.id)}
                                        >
                                            x
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: phaseTasks.length > 0 || showAddTask === phase.id ? '8px 16px 12px' : 0 }}>
                                {phaseTasks.map((task: ProjectTask) => (
                                    <div
                                        key={task.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid #F0F2F5',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={task.state === 'DONE'}
                                                onChange={() => handleTaskState(task.id, task.state === 'DONE' ? 'TODO' : 'DONE')}
                                                style={{ cursor: canEditProject ? 'pointer' : 'default' }}
                                                disabled={!canEditProject}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    textDecoration: task.state === 'DONE' ? 'line-through' : 'none',
                                                    color: task.state === 'DONE' ? '#8FA3BF' : '#0F1C2E',
                                                }}
                                            >
                                                {task.name}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {canEditProject ? (
                                                <>
                                                    <select
                                                        value={task.state ?? 'TODO'}
                                                        onChange={(event) => handleTaskState(task.id, event.target.value)}
                                                        style={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 4px' }}
                                                    >
                                                        <option value="TODO">Cho</option>
                                                        <option value="IN_PROGRESS">Dang lam</option>
                                                        <option value="REVIEW">Review</option>
                                                        <option value="DONE">Xong</option>
                                                    </select>
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12 }}
                                                        onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                        x
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="badge badge-muted">{taskLabels[task.state ?? ''] ?? task.state}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {canEditProject && showAddTask === phase.id && (
                                    <form action={handleAddTask} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <input type="hidden" name="phaseId" value={phase.id} />
                                        <input className="form-input" name="name" placeholder="Ten task..." autoFocus style={{ flex: 1, fontSize: 13 }} />
                                        <button className="btn btn-primary btn-sm" type="submit">Them</button>
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddTask(null)}>Huy</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )
                })}

                {canEditProject && showAddPhase && (
                    <form action={handleAddPhase} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input className="form-input" name="name" placeholder="Ten phase..." autoFocus style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" type="submit">Them</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddPhase(false)}>Huy</button>
                    </form>
                )}
            </div>

            <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Hoa don lien quan</div>
                {(project.invoices || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chua co hoa don</div>
                ) : (
                    <table className="data-table" style={{ fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th>Ma</th>
                                <th>Trang thai</th>
                                <th style={{ textAlign: 'right' }}>So tien</th>
                                <th>Ngay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(project.invoices || []).map((invoice: ProjectInvoice) => (
                                <tr key={invoice.id}>
                                    <td>
                                        <Link href={`/finance/invoices/${invoice.id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>
                                            {invoice.name}
                                        </Link>
                                    </td>
                                    <td><span className={`badge badge-${invoice.state === 'PAID' ? 'success' : 'muted'}`}>{invoice.state}</span></td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(Number(invoice.amountTotal))}</td>
                                    <td style={{ color: '#8FA3BF' }}>{invoice.invoiceDate ? formatDate(String(invoice.invoiceDate).split('T')[0]) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    )
}
