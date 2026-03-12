'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateProjectState, createPhase, updatePhase, deletePhase, createTask, updateTask, deleteTask } from '@/lib/actions/projects'
import { useToast, ToastContainer } from '@/components/Toast'
import { ProjectWithRelations } from '@/lib/types'

const stateColors: Record<string, string> = { DRAFT: 'muted', ACTIVE: 'success', PAUSED: 'warning', DONE: 'primary', CANCELLED: 'danger' }
const stateLabels: Record<string, string> = { DRAFT: 'NhÃ¡p', ACTIVE: 'Äang thá»±c hiá»n', PAUSED: 'Táº¡m dá»«ng', DONE: 'HoÃ n thÃ nh', CANCELLED: 'ÄÃ£ huá»·' }
const stateFlow: Record<string, { next: string; label: string }[]> = {
    DRAFT: [{ next: 'ACTIVE', label: 'â¶ï¸ Báº¯t Äáº§u' }],
    ACTIVE: [{ next: 'PAUSED', label: 'â¸ Táº¡m dá»«ng' }, { next: 'DONE', label: 'ð HoÃ n thÃ nh' }],
    PAUSED: [{ next: 'ACTIVE', label: 'â¶ï¸ Tiáº¿p tá»¥c' }],
    DONE: [], CANCELLED: [{ next: 'DRAFT', label: 'â© Má» láº¡i' }],
}
const phaseLabels: Record<string, string> = { TODO: 'Chá»', IN_PROGRESS: 'Äang lÃ m', DONE: 'Xong' }

export default function ProjectDetail({ project: initProject }: { project: ProjectWithRelations }) {
    const { toasts, addToast } = useToast()
    const [project, setProject] = useState<ProjectWithRelations>(initProject)
    const [phases, setPhases] = useState(initProject.phases || [])
    const tasks = phases.flatMap(p => p.tasks || [])
    const [showAddPhase, setShowAddPhase] = useState(false)
    const [showAddTask, setShowAddTask] = useState<string | null>(null)

    const transitions = stateFlow[project.state] || []
    const totalHours = (project.timesheets || []).reduce((s: number, t) => s + Number(t.hours || 0), 0)

    async function handleState(nextState: string) {
        try {
            const updated = await updateProjectState(project.id, nextState)
            setProject((p) => ({ ...p, ...updated }))
            addToast(`ÄÃ£ chuyá»n sang "${stateLabels[nextState]}"`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handleAddPhase(fd: FormData) {
        const name = fd.get('name') as string
        if (!name) return
        try {
            const ph = await createPhase({ projectId: project.id, name, sequence: phases.length, state: 'TODO' })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPhases((prev) => [...prev, { ...ph, tasks: [] } as any])
            setShowAddPhase(false)
            addToast(`ÄÃ£ thÃªm phase "${name}"`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handlePhaseState(phaseId: string, state: string) {
        try {
            const updated = await updatePhase(phaseId, { state })
            setPhases((prev) => prev.map(p => p.id === phaseId ? { ...p, ...updated } : p))
            addToast(`Phase â ${phaseLabels[state]}`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handleDeletePhase(phaseId: string) {
        if (!confirm('XÃ³a phase vÃ  táº¥t cáº£ tasks trong ÄÃ³?')) return
        try {
            await deletePhase(phaseId)
            setPhases((prev) => prev.filter(p => p.id !== phaseId))
            addToast('ÄÃ£ xÃ³a phase')
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handleAddTask(fd: FormData) {
        const name = fd.get('name') as string
        const phaseId = fd.get('phaseId') as string
        if (!name) return
        try {
            const task = await createTask({ projectId: project.id, phaseId, name, state: 'TODO', priority: 'NORMAL' })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPhases((prev) => prev.map(p => p.id === phaseId ? { ...p, tasks: [...(p.tasks || []), task as any] } : p))
            setShowAddTask(null)
            addToast(`ÄÃ£ thÃªm task "${name}"`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handleTaskState(phaseId: string, taskId: string, state: string) {
        try {
            const updated = await updateTask(taskId, { state })
            setPhases((prev) => prev.map(p => p.id === phaseId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updated } : t) } : p))
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    async function handleDeleteTask(phaseId: string, taskId: string) {
        try {
            await deleteTask(taskId)
            setPhases((prev) => prev.map(p => p.id === phaseId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p))
            addToast('ÄÃ£ xÃ³a task')
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
    }

    const doneCount = tasks.filter((t) => t.state === 'DONE').length
    const progress = tasks.length > 0 ? Math.round(doneCount / tasks.length * 100) : 0

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/projects" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Dá»± Ã¡n</Link>
                <span>âº</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{project.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
                        <span className={`badge badge-${stateColors[project.state]}`}>{stateLabels[project.state]}</span>
                        {project.code && <span style={{ fontSize: 12, color: '#8FA3BF' }}>{project.code}</span>}
                    </div>
                    <p className="page-subtitle">{project.partnerName ?? project.manager?.name ?? 'â'} â¢ Budget: {formatCurrency(Number(project.budget ?? 0))}</p>
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
                    { label: 'Tiáº¿n Äá»', value: `${progress}%`, icon: 'ð' },
                    { label: 'Tasks', value: `${doneCount}/${tasks.length}`, icon: 'â' },
                    { label: 'Giá» cÃ´ng', value: `${totalHours}h`, icon: 'â±ï¸' },
                    { label: 'HoÃ¡ ÄÆ¡n', value: `${(project.invoices || []).length}`, icon: 'ð' },
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
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Giai Äoáº¡n & CÃ´ng viá»c</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPhase(true)}>+ Phase</button>
                </div>

                {phases.length === 0 && !showAddPhase && (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>ChÆ°a cÃ³ phase. Nháº¥n &quot;+ Phase&quot; Äá» thÃªm.</div>
                )}

                {phases.map((phase) => {
                    const phaseTasks = phase.tasks || []
                    return (
                        <div key={phase.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8F9FB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{phase.name}</span>
                                    <select value={phase.state} onChange={e => handlePhaseState(phase.id, e.target.value)}
                                        style={{ fontSize: 11, border: '1px solid #CBD5E1', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}>
                                        <option value="TODO">Chá»</option>
                                        <option value="IN_PROGRESS">Äang lÃ m</option>
                                        <option value="DONE">Xong</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAddTask(phase.id)}>+ Task</button>
                                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}
                                        onClick={() => handleDeletePhase(phase.id)}>â</button>
                                </div>
                            </div>

                            <div style={{ padding: phaseTasks.length > 0 || showAddTask === phase.id ? '8px 16px 12px' : 0 }}>
                                {phaseTasks.map((task) => (
                                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F5' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={task.state === 'DONE'}
                                                onChange={() => handleTaskState(phase.id, task.id, task.state === 'DONE' ? 'TODO' : 'DONE')}
                                                style={{ cursor: 'pointer' }} />
                                            <span style={{ fontSize: 13, textDecoration: task.state === 'DONE' ? 'line-through' : 'none', color: task.state === 'DONE' ? '#8FA3BF' : '#0F1C2E' }}>
                                                {task.name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <select value={task.state} onChange={e => handleTaskState(phase.id, task.id, e.target.value)}
                                                style={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 4, padding: '1px 4px' }}>
                                                <option value="TODO">Chá»</option>
                                                <option value="IN_PROGRESS">Äang lÃ m</option>
                                                <option value="REVIEW">Review</option>
                                                <option value="DONE">Xong</option>
                                            </select>
                                            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: 12 }}
                                                onClick={() => handleDeleteTask(phase.id, task.id)}>â</button>
                                        </div>
                                    </div>
                                ))}

                                {showAddTask === phase.id && (
                                    <form action={handleAddTask} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <input type="hidden" name="phaseId" value={phase.id} />
                                        <input className="form-input" name="name" placeholder="TÃªn task..." autoFocus style={{ flex: 1, fontSize: 13 }} />
                                        <button className="btn btn-primary btn-sm" type="submit">ThÃªm</button>
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddTask(null)}>Huá»·</button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )
                })}

                {showAddPhase && (
                    <form action={handleAddPhase} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input className="form-input" name="name" placeholder="TÃªn phase..." autoFocus style={{ flex: 1 }} />
                        <button className="btn btn-primary btn-sm" type="submit">ThÃªm</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddPhase(false)}>Huá»·</button>
                    </form>
                )}
            </div>

            {/* Invoices */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>HoÃ¡ ÄÆ¡n liÃªn quan</div>
                {(project.invoices || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>ChÆ°a cÃ³ hoÃ¡ ÄÆ¡n</div>
                ) : (
                    <table className="data-table" style={{ fontSize: 13 }}>
                        <thead><tr><th>MÃ£</th><th>Tráº¡ng thÃ¡i</th><th style={{ textAlign: 'right' }}>Sá» tiá»n</th><th>NgÃ y</th></tr></thead>
                        <tbody>
                            {(project.invoices || []).map((inv) => (
                                <tr key={inv.id}>
                                    <td><Link href={`/finance/invoices/${inv.id}`} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>{inv.name}</Link></td>
                                    <td><span className={`badge badge-${inv.state === 'PAID' ? 'success' : 'muted'}`}>{inv.state}</span></td>
                                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(Number(inv.amountTotal))}</td>
                                    <td style={{ color: '#8FA3BF' }}>{inv.invoiceDate ? formatDate(String(inv.invoiceDate).split('T')[0]) : 'â'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    )
}
