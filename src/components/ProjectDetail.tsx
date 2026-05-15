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

interface TeamMember {
    employeeId: string
    name: string
    department: string
    totalHours: number
    phase: string | null
    monthlyHours: Record<string, number>
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
    teamMembers?: TeamMember[]
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
    DRAFT: 'Nháp',
    ACTIVE: 'Đang thực hiện',
    PAUSED: 'Tạm dừng',
    DONE: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
}

const stateFlow: Record<string, { next: string; label: string }[]> = {
    DRAFT: [{ next: 'ACTIVE', label: 'Bắt đầu' }],
    ACTIVE: [
        { next: 'PAUSED', label: 'Tạm dừng' },
        { next: 'DONE', label: 'Hoàn thành' },
    ],
    PAUSED: [{ next: 'ACTIVE', label: 'Tiếp tục' }],
    DONE: [],
    CANCELLED: [{ next: 'DRAFT', label: 'Mở lại' }],
}

const phaseLabels: Record<string, string> = {
    TODO: 'Chờ',
    IN_PROGRESS: 'Đang làm',
    DONE: 'Xong',
}

const taskLabels: Record<string, string> = {
    TODO: 'Chờ',
    IN_PROGRESS: 'Đang làm',
    REVIEW: 'Review',
    DONE: 'Xong',
}

const phaseNameMap: Record<string, string> = {
    CD: 'Construction Document',
    BD: 'Basic Design',
    DD: 'Design Development',
    SV: 'Supervision',
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
    const teamMembers = project.teamMembers || []

    // Get monthly trend months
    const allMonths = new Set<string>()
    for (const m of teamMembers) {
        for (const key of Object.keys(m.monthlyHours)) allMonths.add(key)
    }
    const months = Array.from(allMonths).sort()

    async function handleState(nextState: string) {
        try {
            const result = await updateProjectState(project.id, nextState)
            if ('success' in result && !result.success) {
                addToast(result.error || 'Lỗi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setProject((current: ProjectData) => ({ ...current, ...updated }))
            addToast(`Đã chuyển sang "${stateLabels[nextState]}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
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
                addToast(result.error || 'Lỗi', 'error')
                return
            }

            const phase = 'data' in result ? result.data : result
            setPhases((current: ProjectPhase[]) => [...current, phase as unknown as ProjectPhase])
            setShowAddPhase(false)
            addToast(`Đã thêm phase "${name}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
        }
    }

    async function handlePhaseState(phaseId: string, state: string) {
        try {
            const result = await updatePhase(phaseId, { state })
            if ('success' in result && !result.success) {
                addToast(result.error || 'Lỗi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setPhases((current: ProjectPhase[]) => current.map((phase) => (
                phase.id === phaseId ? { ...phase, ...updated } : phase
            )))
            addToast(`Phase → ${phaseLabels[state]}`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
        }
    }

    async function handleDeletePhase(phaseId: string) {
        if (!confirm('Xoá phase và tất cả tasks trong đó?')) return

        try {
            await deletePhase(phaseId)
            setPhases((current: ProjectPhase[]) => current.filter((phase) => phase.id !== phaseId))
            setTasks((current: ProjectTask[]) => current.filter((task) => task.phaseId !== phaseId))
            addToast('Đã xoá phase')
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
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
                addToast(result.error || 'Lỗi', 'error')
                return
            }

            const task = 'data' in result ? result.data : result
            setTasks((current: ProjectTask[]) => [...current, task as unknown as ProjectTask])
            setShowAddTask(null)
            addToast(`Đã thêm task "${name}"`)
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
        }
    }

    async function handleTaskState(taskId: string, state: string) {
        try {
            const result = await updateTask(taskId, { state })
            if ('success' in result && !result.success) {
                addToast(result.error || 'Lỗi', 'error')
                return
            }

            const updated = 'data' in result ? result.data : result
            setTasks((current: ProjectTask[]) => current.map((task) => (
                task.id === taskId ? { ...task, ...updated } : task
            )))
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
        }
    }

    async function handleDeleteTask(taskId: string) {
        try {
            await deleteTask(taskId)
            setTasks((current: ProjectTask[]) => current.filter((task) => task.id !== taskId))
            addToast('Đã xoá task')
        } catch (error: unknown) {
            addToast(error instanceof Error ? error.message : 'Lỗi', 'error')
        }
    }

    const maxMemberHours = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.totalHours)) : 1

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/projects" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Dự án</Link>
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
                    { label: 'Tiến độ', value: `${progress}%`, icon: '📊', color: '#6366F1' },
                    { label: 'Tasks', value: `${doneCount}/${tasks.length}`, icon: '✅', color: '#22C55E' },
                    { label: 'Giờ công', value: `${Math.round(totalHours)}h`, icon: '⏱️', color: '#F59E0B' },
                    { label: 'Nhân sự', value: `${teamMembers.length}`, icon: '👥', color: '#3B82F6' },
                ].map((kpi) => (
                    <div key={kpi.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div className="kpi-label">{kpi.label}</div>
                                <div className="kpi-value" style={{ fontSize: 22, marginTop: 4, color: kpi.color }}>{kpi.value}</div>
                            </div>
                            <div style={{ fontSize: 28 }}>{kpi.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Members & Timesheet Section */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1F3A5F' }}>👥 Nhân sự & Giờ công</div>
                    <Link href="/timesheets" style={{ fontSize: 12, color: '#6366F1', textDecoration: 'none', fontWeight: 600 }}>
                        Xem Timesheet →
                    </Link>
                </div>

                {teamMembers.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                        Chưa có dữ liệu giờ công cho dự án này
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ fontSize: 13 }}>
                            <thead>
                                <tr>
                                    <th>Nhân viên</th>
                                    <th>Phòng ban</th>
                                    <th>Phase</th>
                                    <th style={{ textAlign: 'right' }}>Tổng giờ</th>
                                    {months.map(m => (
                                        <th key={m} style={{ textAlign: 'center', fontSize: 11 }}>
                                            T{parseInt(m.split('-')[1])}
                                        </th>
                                    ))}
                                    <th style={{ width: 120 }}>Phân bổ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map((member) => (
                                    <tr key={member.employeeId}>
                                        <td style={{ fontWeight: 600, color: '#1F3A5F' }}>{member.name}</td>
                                        <td style={{ color: '#4A5E78' }}>{member.department}</td>
                                        <td>
                                            {member.phase ? (
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600,
                                                    padding: '2px 8px', borderRadius: 10,
                                                    background: '#6366F115', color: '#6366F1',
                                                }}>
                                                    {member.phase} {phaseNameMap[member.phase] ? `• ${phaseNameMap[member.phase]}` : ''}
                                                </span>
                                            ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>
                                            {member.totalHours}h
                                        </td>
                                        {months.map(m => {
                                            const h = member.monthlyHours[m] || 0
                                            return (
                                                <td key={m} style={{ textAlign: 'center', color: h > 0 ? '#4A5E78' : '#CBD5E1', fontWeight: h > 0 ? 600 : 400 }}>
                                                    {h > 0 ? `${Math.round(h)}` : '—'}
                                                </td>
                                            )
                                        })}
                                        <td>
                                            <div style={{
                                                height: 6, borderRadius: 3,
                                                background: '#E2E8F0',
                                                overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.round(member.totalHours / maxMemberHours * 100)}%`,
                                                    background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                                                    borderRadius: 3,
                                                    transition: 'width 0.3s ease',
                                                }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: '#F8F9FB', fontWeight: 700 }}>
                                    <td colSpan={3} style={{ color: '#1F3A5F' }}>Tổng</td>
                                    <td style={{ textAlign: 'right', color: '#6366F1' }}>
                                        {Math.round(totalHours)}h
                                    </td>
                                    {months.map(m => {
                                        const monthTotal = teamMembers.reduce((s, mem) => s + (mem.monthlyHours[m] || 0), 0)
                                        return (
                                            <td key={m} style={{ textAlign: 'center', color: '#6366F1' }}>
                                                {Math.round(monthTotal)}
                                            </td>
                                        )
                                    })}
                                    <td />
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Phases & Tasks */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1F3A5F' }}>📋 Giai đoạn & Công việc</div>
                    {canEditProject && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPhase(true)}>+ Phase</button>
                    )}
                </div>

                {phases.length === 0 && !showAddPhase && (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                        {canEditProject ? 'Chưa có phase. Nhấn "+ Phase" để thêm.' : 'Chưa có phase.'}
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
                                            <option value="TODO">Chờ</option>
                                            <option value="IN_PROGRESS">Đang làm</option>
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
                                            ✕
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
                                                        <option value="TODO">Chờ</option>
                                                        <option value="IN_PROGRESS">Đang làm</option>
                                                        <option value="REVIEW">Review</option>
                                                        <option value="DONE">Xong</option>
                                                    </select>
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12 }}
                                                        onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                        ✕
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
                                        <input className="form-input" name="name" placeholder="Tên task..." autoFocus style={{ flex: 1, fontSize: 13 }} />
                                        <button className="btn btn-primary btn-sm" type="submit">Thêm</button>
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddTask(null)}>Huỷ</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )
                })}

                {canEditProject && showAddPhase && (
                    <form action={handleAddPhase} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input className="form-input" name="name" placeholder="Tên phase..." autoFocus style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" type="submit">Thêm</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddPhase(false)}>Huỷ</button>
                    </form>
                )}
            </div>

            {/* Invoices */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#1F3A5F' }}>💰 Hoá đơn liên quan</div>
                {(project.invoices || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có hoá đơn</div>
                ) : (
                    <table className="data-table" style={{ fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Số tiền</th>
                                <th>Ngày</th>
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
