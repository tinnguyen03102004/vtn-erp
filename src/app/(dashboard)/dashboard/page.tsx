import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getDashboardKPIs, getRecentProjects, getRecentLeads, getChartData } from '@/lib/actions/dashboard'
import DashboardCharts from './charts'




const stateColors: Record<string, string> = {
    ACTIVE: 'success', PAUSED: 'warning', DONE: 'primary', CANCELLED: 'danger', DRAFT: 'muted'
}
const stateLabels: Record<string, string> = {
    ACTIVE: 'Äang cháº¡y', PAUSED: 'Táº¡m dá»«ng', DONE: 'HoÃ n thÃ nh', CANCELLED: 'Huá»·', DRAFT: 'NhÃ¡p'
}

const _: Record<string, string> = {
    'Leads má»i': 'muted', 'LiÃªn há»': 'info', 'Äá» xuáº¥t': 'warning',
    'ÄÃ m phÃ¡n': 'accent', 'Tháº¯ng': 'success',
}

export default async function DashboardPage() {
    const [kpisResult, projectsResult, leadsResult, chartResult] = await Promise.all([
        getDashboardKPIs(),
        getRecentProjects(),
        getRecentLeads(),
        getChartData(),
    ])

    const kpis = kpisResult.success ? kpisResult.data : { activeProjects: 0, pendingInvoices: 0, totalEmployees: 0, totalLeads: 0 }
    const recentProjects = projectsResult.success ? projectsResult.data : []
    const recentLeads = leadsResult.success ? leadsResult.data : []
    const chartData = chartResult.success ? chartResult.data : { revenueData: [], projectStatusData: [] }

    return (
        <>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Tá»ng quan hoáº¡t Äá»ng Cty TNHH VÃµ Trá»ng NghÄ©a</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Xuáº¥t bÃ¡o cÃ¡o
                    </button>
                    <Link href="/projects" className="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Táº¡o dá»± Ã¡n
                    </Link>
                </div>
            </div>

            {/* KPI Cards â Real Data */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    {
                        label: 'Dá»± Ã¡n Äang cháº¡y',
                        value: `${kpis.activeProjects}`,
                        meta: `${kpis.totalLeads} leads trong pipeline`,
                        icon: (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                            </svg>
                        ),
                        iconBg: '#EFF3FA',
                        iconColor: '#1F3A5F',
                    },
                    {
                        label: 'HÃ³a ÄÆ¡n chá» thanh toÃ¡n',
                        value: formatCurrency(kpis.pendingInvoices),
                        meta: 'HÃ³a ÄÆ¡n chá» thanh toÃ¡n',
                        icon: (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        ),
                        iconBg: '#FFF7ED',
                        iconColor: '#F59E0B',
                    },
                    {
                        label: 'Tá»ng nhÃ¢n sá»±',
                        value: `${kpis.totalEmployees}`,
                        meta: 'NhÃ¢n viÃªn Äang hoáº¡t Äá»ng',
                        icon: (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        ),
                        iconBg: '#F0FDF4',
                        iconColor: '#22C55E',
                    },
                    {
                        label: 'Tá»ng Leads',
                        value: `${kpis.totalLeads}`,
                        meta: 'KhÃ¡ch hÃ ng tiá»m nÄng',
                        icon: (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                            </svg>
                        ),
                        iconBg: '#FBF5E6',
                        iconColor: '#C9A84C',
                    },
                ].map((kpi) => (
                    <div key={kpi.label} className="kpi-card">
                        <div className="kpi-icon" style={{ background: kpi.iconBg, color: kpi.iconColor }}>
                            {kpi.icon}
                        </div>
                        <div className="kpi-label">{kpi.label}</div>
                        <div className="kpi-value">{kpi.value}</div>
                        <div className="kpi-meta">{kpi.meta}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row â Client Component for Recharts */}
            <DashboardCharts revenueData={chartData.revenueData} projectStatusData={chartData.projectStatusData} />

            {/* Bottom Row */}
            <div className="grid-2">
                {/* Recent Projects â Real Data */}
                <div className="card">
                    <div className="card-header" style={{ paddingBottom: 16 }}>
                        <div className="card-title">Dá»± Ã¡n gáº§n ÄÃ¢y</div>
                        <Link href="/projects" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Xem táº¥t cáº£ â</Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Dá»± Ã¡n</th>
                                    <th>Giai Äoáº¡n</th>
                                    <th>Tiáº¿n Äá»</th>
                                    <th>Tráº¡ng thÃ¡i</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.map((p) => {
                                    const progress = 0
                                    const currentPhase = 'â'
                                    return (
                                        <tr key={p.id} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F1C2E' }}>{p.name}</div>
                                                    <div style={{ fontSize: 11, color: '#8FA3BF' }}>{p.code} â¢ {p.partnerName ?? 'â'}</div>
                                                </Link>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#4A5E78' }}>{currentPhase}</td>
                                            <td style={{ width: 100 }}>
                                                <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 600, color: '#0F1C2E' }}>{progress}%</div>
                                                <div className="progress">
                                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${stateColors[p.state] || 'muted'}`}>
                                                    {stateLabels[p.state]}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {recentProjects.length === 0 && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>ChÆ°a cÃ³ dá»± Ã¡n nÃ o</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Recent Leads â Real Data */}
                    <div className="card">
                        <div className="card-header" style={{ paddingBottom: 16 }}>
                            <div className="card-title">Leads má»i nháº¥t</div>
                            <Link href="/crm" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Xem táº¥t cáº£ â</Link>
                        </div>
                        <div className="card-body" style={{ paddingTop: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {recentLeads.map((lead) => (
                                    <Link key={lead.id} href={`/crm/${lead.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', borderRadius: 8,
                                            background: '#F8F9FB', border: '1px solid #E2E8F0',
                                            transition: 'all 0.15s ease',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#0F1C2E' }}>{lead.name}</div>
                                                <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>{lead.partnerName}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1F3A5F' }}>
                                                    {formatCurrency(Number(lead.expectedValue ?? 0))}
                                                </div>
                                                <span className={`badge badge-muted`} style={{ marginTop: 4 }}>
                                                    {lead.source ?? 'â'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {recentLeads.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 16 }}>ChÆ°a cÃ³ leads</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header" style={{ paddingBottom: 0 }}>
                            <div className="card-title">Truy cáº­p nhanh</div>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {[
                                    { href: '/crm', label: 'ThÃªm Lead', icon: 'ð¤', color: '#EFF3FA' },
                                    { href: '/sale/new', label: 'Táº¡o bÃ¡o giÃ¡', icon: 'ð', color: '#FBF5E6' },
                                    { href: '/projects', label: 'Dá»± Ã¡n má»i', icon: 'ð-ï¸', color: '#F0FDF4' },
                                    { href: '/finance/invoices', label: 'Xuáº¥t hÃ³a ÄÆ¡n', icon: 'ð³', color: '#FFF7ED' },
                                    { href: '/timesheets', label: 'Log timesheet', icon: 'â±ï¸', color: '#EFF6FF' },
                                    { href: '/reports', label: 'Xem bÃ¡o cÃ¡o', icon: 'ð', color: '#F5F3FF' },
                                ].map((action) => (
                                    <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 12px', borderRadius: 8, background: action.color,
                                            fontSize: 13, fontWeight: 600, color: '#0F1C2E',
                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                        }}>
                                            <span style={{ fontSize: 18 }}>{action.icon}</span>
                                            {action.label}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
