import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getProjects } from '@/lib/actions/projects'

export const dynamic = 'force-dynamic'

const stateColors: Record<string, string> = {
    ACTIVE: 'success', PAUSED: 'warning', DONE: 'primary', CANCELLED: 'danger', DRAFT: 'muted'
}
const stateLabels: Record<string, string> = {
    ACTIVE: 'Äang cháº¡y', PAUSED: 'Táº¡m dá»«ng', DONE: 'HoÃ n thÃ nh', CANCELLED: 'Huá»·', DRAFT: 'NhÃ¡p'
}

export default async function ProjectsPage() {
    const projects = await getProjects()

    const activeCount = projects.filter(p => p.state === 'ACTIVE').length
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget ?? 0), 0)

    return (
        <>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Dá»± Ã¡n</h1>
                    <p className="page-subtitle">{projects.length} dá»± Ã¡n â {activeCount} Äang cháº¡y</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Táº¡o dá»± Ã¡n
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Äang cháº¡y', value: `${activeCount}`, icon: 'ð-ï¸', color: '#EFF3FA' },
                    { label: 'Táº¡m dá»«ng', value: `${projects.filter(p => p.state === 'PAUSED').length}`, icon: 'â¸ï¸', color: '#FFF7ED' },
                    { label: 'Tá»ng budget', value: formatCurrency(totalBudget), icon: 'ð°', color: '#FBF5E6' },
                    { label: 'HoÃ n thÃ nh', value: `${projects.filter(p => p.state === 'DONE').length}`, icon: 'â', color: '#F0FDF4' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-label">{k.label}</div>
                                <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{k.value}</div>
                            </div>
                            <div style={{ fontSize: 28 }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header" style={{ paddingBottom: 16 }}>
                    <div className="card-title">Danh sÃ¡ch Dá»± Ã¡n</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>MÃ£ dá»± Ã¡n</th>
                                <th>TÃªn dá»± Ã¡n</th>
                                <th>KhÃ¡ch hÃ ng</th>
                                <th>Quáº£n lÃ½</th>
                                <th>Tráº¡ng thÃ¡i</th>
                                <th>Phases</th>
                                <th>Budget</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const donePhases = project.phases.filter((p: any) => p.state === 'DONE').length
                                const totalPhases = project.phases.length
                                const progress = totalPhases > 0 ? Math.round(donePhases / totalPhases * 100) : 0
                                return (
                                    <tr key={project.id}>
                                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F3A5F', fontSize: 13 }}>{project.code}</span></td>
                                        <td style={{ fontWeight: 600, fontSize: 13 }}>{project.name}</td>
                                        <td style={{ fontSize: 13, color: '#4A5E78' }}>{project.partnerName}</td>
                                        <td style={{ fontSize: 13 }}>{project.manager?.name ?? 'â'}</td>
                                        <td><span className={`badge badge-${stateColors[project.state]}`}>{stateLabels[project.state]}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress" style={{ width: 60 }}>
                                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5E78' }}>{donePhases}/{totalPhases}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(project.budget ?? 0))}</td>
                                        <td>
                                            <Link href={`/projects/${project.id}`} className="btn btn-ghost btn-sm">Xem â</Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
