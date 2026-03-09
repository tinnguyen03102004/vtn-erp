import { formatCurrency } from '@/lib/utils'
import { getProjects } from '@/lib/actions/projects'
import { getInvoices } from '@/lib/actions/finance'
import { getEmployees } from '@/lib/actions/employees'
import { getLeadsByStage } from '@/lib/actions/crm'


export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
    const [projects, invoices, employees, stages] = await Promise.all([
        getProjects(),
        getInvoices(),
        getEmployees(),
        getLeadsByStage(),
    ])

    // Calculate real KPIs
    const totalRevenue = invoices
        .filter(i => i.state === 'PAID')
        .reduce((s, i) => s + Number(i.amountTotal), 0)

    const totalPending = invoices
        .filter(i => i.state === 'POSTED')
        .reduce((s, i) => s + Number(i.amountTotal), 0)

    const totalEmployees = employees.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalHoursMonth = employees.reduce((s: number, e: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s + e.timesheets.reduce((ts: number, t: any) => ts + t.hours, 0), 0)
    const avgUtil = totalEmployees > 0 ? Math.round(totalHoursMonth / (totalEmployees * 168) * 100) : 0

    const allLeads = stages.flatMap(s => s.leads)
    const wonLeads = stages.find(s => s.name === 'Thắng')?.leads.length ?? 0
    const conversionRate = allLeads.length > 0 ? Math.round(wonLeads / allLeads.length * 100) : 0

    // Utilization data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const utilizationData = employees.map((e: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hours = e.timesheets.reduce((s: number, t: any) => s + t.hours, 0)
        return {
            name: e.user.name ?? '—',
            util: Math.round(hours / 168 * 100),
            hours,
        }
    }).sort((a, b) => b.util - a.util)

    // Project profitability data
    const projectData = projects.map(p => ({
        name: p.name,
        budget: Number(p.budget ?? 0),
        state: p.state,
        phasesTotal: p.phases.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phasesDone: p.phases.filter((ph: any) => ph.state === 'DONE').length,
    }))

    // Lead source breakdown
    const sourceMap: Record<string, number> = {}
    allLeads.forEach(l => {
        const src = l.source ?? 'Khác'
        sourceMap[src] = (sourceMap[src] || 0) + 1
    })
    const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }))

    return (
        <>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Báo cáo & Phân tích</h1>
                    <p className="page-subtitle">Dữ liệu thực từ Database</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Summary KPIs — Real Data */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Đã thu', value: formatCurrency(totalRevenue), sub: `${invoices.filter(i => i.state === 'PAID').length} hóa đơn`, color: '#F0FDF4', icon: '💰' },
                    { label: 'Chờ thanh toán', value: formatCurrency(totalPending), sub: `${invoices.filter(i => i.state === 'POSTED').length} hóa đơn`, color: '#FBF5E6', icon: '⏳' },
                    { label: 'Tổng giờ làm', value: `${totalHoursMonth}h`, sub: `Avg util: ${avgUtil}%`, color: '#EFF6FF', icon: '⏱️' },
                    { label: 'Leads → Thắng', value: `${conversionRate}%`, sub: `${wonLeads}/${allLeads.length} leads`, color: '#EFF3FA', icon: '🎯' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: 18, background: k.color }}>
                        <div style={{ fontSize: 24, marginBottom: 6 }}>{k.icon}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value" style={{ fontSize: 22, margin: '4px 0' }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: '#4A5E78' }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Row 1: Utilization + Project Progress */}
            <div className="grid-2" style={{ marginBottom: 20 }}>
                {/* Utilization */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Utilization Rate (Tháng này)</div>
                        <span className="badge badge-muted">{totalEmployees} nhân viên</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {utilizationData.map(u => (
                                <div key={u.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                                        <span style={{ color: '#4A5E78', fontWeight: 500 }}>{u.name}</span>
                                        <span style={{ fontWeight: 700, color: u.util >= 90 ? '#22C55E' : u.util >= 75 ? '#C9A84C' : '#EF4444' }}>
                                            {u.hours}h ({u.util}%)
                                        </span>
                                    </div>
                                    <div className="progress">
                                        <div className="progress-bar" style={{
                                            width: `${Math.min(100, u.util)}%`,
                                            background: u.util >= 90 ? '#22C55E' : u.util >= 75 ? '#C9A84C' : '#EF4444',
                                        }} />
                                    </div>
                                </div>
                            ))}
                            {utilizationData.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 16 }}>Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Project Progress */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Tiến độ Dự án</div>
                        <span className="badge badge-primary">{projects.length} dự án</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {projectData.map(p => {
                                const progress = p.phasesTotal > 0 ? Math.round(p.phasesDone / p.phasesTotal * 100) : 0
                                return (
                                    <div key={p.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                            <span style={{ fontWeight: 500, color: '#0F1C2E' }}>{p.name}</span>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <span style={{ color: '#8FA3BF', fontSize: 12 }}>{formatCurrency(p.budget)}</span>
                                                <span style={{ fontWeight: 700, color: progress >= 80 ? '#22C55E' : '#C9A84C', fontSize: 13 }}>
                                                    {progress}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="progress">
                                            <div className="progress-bar" style={{
                                                width: `${progress}%`,
                                                background: progress >= 80 ? '#22C55E' : '#C9A84C',
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Source breakdown + Charts */}
            <div className="grid-2">
                {/* Lead Sources */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Nguồn khách hàng</div>
                        <span className="badge badge-muted">{allLeads.length} leads</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {sourceData.map(s => {
                                const pct = allLeads.length > 0 ? Math.round(s.value / allLeads.length * 100) : 0
                                return (
                                    <div key={s.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                            <span style={{ color: '#4A5E78', fontWeight: 500 }}>{s.name}</span>
                                            <span style={{ fontWeight: 700, color: '#0F1C2E' }}>{s.value} ({pct}%)</span>
                                        </div>
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                            {sourceData.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 16 }}>Chưa có leads</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Summary */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Tình trạng Hóa đơn</div>
                        <span className="badge badge-muted">{invoices.length} hóa đơn</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Đã thanh toán', count: invoices.filter(i => i.state === 'PAID').length, amount: invoices.filter(i => i.state === 'PAID').reduce((s, i) => s + Number(i.amountTotal), 0), color: '#22C55E' },
                                { label: 'Đã xuất', count: invoices.filter(i => i.state === 'POSTED').length, amount: invoices.filter(i => i.state === 'POSTED').reduce((s, i) => s + Number(i.amountTotal), 0), color: '#3B82F6' },
                                { label: 'Nháp', count: invoices.filter(i => i.state === 'DRAFT').length, amount: invoices.filter(i => i.state === 'DRAFT').reduce((s, i) => s + Number(i.amountTotal), 0), color: '#8FA3BF' },
                                { label: 'Huỷ', count: invoices.filter(i => i.state === 'CANCELLED').length, amount: invoices.filter(i => i.state === 'CANCELLED').reduce((s, i) => s + Number(i.amountTotal), 0), color: '#EF4444' },
                            ].filter(s => s.count > 0).map(s => (
                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E' }}>{s.label}</div>
                                            <div style={{ fontSize: 11, color: '#8FA3BF' }}>{s.count} hóa đơn</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(s.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
