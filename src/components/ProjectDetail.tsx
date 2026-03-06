'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateProjectState, createPhase, updatePhase, deletePhase, createTask, updateTask, deleteTask } from '@/lib/actions/projects'
import { useToast, ToastContainer } from '@/components/Toast'

const stateColors: Record<string, string> = { DRAFT: 'muted', ACTIVE: 'success', PAUSED: 'warning', DONE: 'primary', CANCELLED: 'danger' }
const stateLabels: Record<string, string> = { DRAFT: 'Nháp', ACTIVE: 'Đang thực hiện', PAUSED: 'Tạm dừng', DONE: 'Hoàn thành', CANCELLED: 'Đã huỷ' }
const stateFlow: Record<string, { next: string; label: string }[]> = {
    DRAFT: [{ next: 'ACTIVE', label: '▶️ Bắt đầu' }],
    ACTIVE: [{ next: 'PAUSED', label: '⏸ Tạm dừng' }, { next: 'DONE', label: '🏁 Hoàn thành' }],
    PAUSED: [{ next: 'ACTIVE', label: '▶️ Tiếp tục' }],
    DONE: [], CANCELLED: [{ next: 'DRAFT', label: '↩ Mở lại' }],
}
const phaseLabels: Record<string, string> = { TODO: 'Chờ', IN_PROGRESS: 'Đang làm', DONE: 'Xong' }
const taskLabels: Record<string, string> = { TODO: 'Chờ', IN_PROGRESS: 'Đang làm', REVIEW: 'Review', DONE: 'Xong' }

export default function ProjectDetail({ project: initProject }: { project: any }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [project, setProject] = useState(initProject)
    const [phases, setPhases] = useState(initProject.phases || [])
    const [tasks, setTasks] = useState(initProject.tasks || [])
    const [showAddPhase, setShowAddPhase] = useState(false)
    const [showAddTask, setShowAddTask] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const transitions = stateFlow[project.state] || []
    const totalHours = (project.timesheets || []).reduce((s: number, t: any) => s + Number(t.hours || 0), 0)

    async function handleState(nextState: string) {
        try {
            const updated = await updateProjectState(project.id, nextState)
            setProject((p: any) => ({ ...p, ...updated }))
            addToast(`Đã chuyển sang "${stateLabels[nextState]}"`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleAddPhase(fd: FormData) {
        const name = fd.get('name') as string
        if (!name) return
        try {
            const ph = await createPhase({ projectId: project.id, name, sequence: phases.length, state: 'TODO' })
            setPhases((prev: any[]) => [...prev, ph])
            setShowAddPhase(false)
            addToast(`Đã thêm phase "${name}"`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handlePhaseState(phaseId: string, state: string) {
        try {
            const updated = await updatePhase(phaseId, { state })
            setPhases((prev: any[]) => prev.map(p => p.id === phaseId ? { ...p, ...updated } : p))
            addToast(`Phase → ${phaseLabels[state]}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleDeletePhase(phaseId: string) {
        if (!confirm('Xóa phase và tất cả tasks trong đó?')) return
        try {
            await deletePhase(phaseId)
            setPhases((prev: any[]) => prev.filter(p => p.id !== phaseId))
            setTasks((prev: any[]) => prev.filter(t => t.phaseId !== phaseId))
            addToast('Đã xóa phase')
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleAddTask(fd: FormData) {
        const name = fd.get('name') as string
        const phaseId = fd.get('phaseId') as string
        if (!name) return
        try {
            const task = await createTask({ projectId: project.id, phaseId, name, state: 'TODO', priority: 'NORMAL' })
            setTasks((prev: any[]) => [...prev, task])
            setShowAddTask(null)
            addToast(`Đã thêm task "${name}"`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleTaskState(taskId: string, state: string) {
        try {
            const updated = await updateTask(taskId, { state })
            setTasks((prev: any[]) => prev.map(t => t.id === taskId ? { ...t, ...updated } : t))
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleDeleteTask(taskId: string) {
        try {
            await deleteTask(taskId)
            setTasks((prev: any[]) => prev.filter(t => t.id !== taskId))
            addToast('Đã xóa task')
        } catch (err: any) { addToast(err.message, 'error') }
    }

    const doneCount = tasks.filter((t: any) => t.state === 'DONE').length
    const progress = tasks.length > 0 ? Math.round(doneCount / tasks.length * 100) : 0

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/projects" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Dự án</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{project.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
                        <span className={`badge badge-${stateColors[project.state]}`}>{stateLabels[project.state]}</span>
                        {project.code && <span style={{ fontSize: 12, color: '#8FA3BF' }}>{project.code}</span>}
                    </div>
                    <p className="page-subtitle">{project.partnerName ?? project.manager?.name ?? '—'} • Budget: {formatCurrency(Number(project.budget ?? 0))}</p>
                </div>
                <div className="page-actions">
                    {transitions.map(t => (
                        <button key={t.next} className="btn btn-primary btn-sm" onClick={() => handleState(t.next)}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Tiến độ', value: `${progress}%`, icon: '📊' },
                    { label: 'Tasks', value: `${doneCount}/${tasks.length}`, icon: '✅' },
                    { label: 'Giờ công', value: `${totalHours}h`, icon: '⏱️' },
                    { label: 'Hoá đơn', value: `${(project.invoices || []).length}`, icon: '📄' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div className="kpi-label">{k.label}</div>
                                <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{k.value}</div>
                            </div>
                            <div style={{ fontSize: 24 }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Phases + Tasks */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Giai đoạn & Công việc</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPhase(true)}>+ Phase</button>
                </div>

                {phases.length === 0 && !showAddPhase && (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>Chưa có phase. Nhấn "+ Phase" để thêm.</div>
                )}

                {phases.map((phase: any) => {
                    const phaseTasks = tasks.filter((t: any) => t.phaseId === phase.id)
                    return (
                        <div key={phase.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8F9FB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{phase.name}</span>
                                    <select value={phase.state} onChange={e => handlePhaseState(phase.id, e.target.value)}
                                        style={{ fontSize: 11, border: '1px solid #CBD5E1', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>
                                        <option value="TODO">Chờ</option>
                                        <option value="IN_PROGRESS">Đang làm</option>
                                        <option value="DONE">Xong</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAddTask(phase.id)}>+ Task</button>
                                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}
                                        onClick={() => handleDeletePhase(phase.id)}>✕</button>
                                </div>
                            </div>

                            <div style={{ padding: phaseTasks.length > 0 || showAddTask === phase.id ? '8px 16px 12px' : 0 }}>
                                {phaseTasks.map((task: any) => (
                                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F5' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={task.state === 'DONE'}
                                                onChange={() => handleTaskState(task.id, task.state === 'DONE' ? 'TODO' : 'DONE')}
                                                style={{ cursor: 'pointer' }} />
                                            <span style={{ fontSize: 13, textDecoration: task.state === 'DONE' ? 'line-through' : 'none', color: task.state === 'DONE' ? '#8FA3BF' : '#0F1C2E' }}>
                                                {task.name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <select value={task.state} onChange={e => handleTaskState(task.id, e.target.value)}
                                                style={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 4px' }}>
                                                <option value="TODO">Chờ</option>
                                                <option value="IN_PROGRESS">Đang làm</option>
                                                <option value="REVIEW">Review</option>
                                                <option value="DONE">Xong</option>
                                            </select>
                                            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12 }}
                                                onClick={() => handleDeleteTask(task.id)}>✕</button>
                                        </div>
                                    </div>
                                ))}

                                {showAddTask === phase.id && (
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

                {showAddPhase && (
                    <form action={handleAddPhase} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input className="form-input" name="name" placeholder="Tên phase..." autoFocus style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" type="submit">Thêm</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddPhase(false)}>Huỷ</button>
                    </form>
                )}
            </div>

            {/* Invoices */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Hoá đơn liên quan</div>
                {(project.invoices || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có hoá đơn</div>
                ) : (
                    <table className="data-table" style={{ fontSize: 13 }}>
                        <thead><tr><th>Mã</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Số tiền</th><th>Ngày</th></tr></thead>
                        <tbody>
                            {(project.invoices || []).map((inv: any) => (
                                <tr key={inv.id}>
                                    <td><Link href={`/finance/invoices/${inv.id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>{inv.name}</Link></td>
                                    <td><span className={`badge badge-${inv.state === 'PAID' ? 'success' : 'muted'}`}>{inv.state}</span></td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(Number(inv.amountTotal))}</td>
                                    <td style={{ color: '#8FA3BF' }}>{inv.invoiceDate ? formatDate(String(inv.invoiceDate).split('T')[0]) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    )
}
