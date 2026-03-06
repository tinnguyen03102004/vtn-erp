'use client'

import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

interface Props {
    revenueData: { month: string; revenue: number }[]
    projectStatusData: { name: string; value: number; color: string }[]
}

// Fallback data if no real data
const defaultRevenue = [
    { month: 'T10', revenue: 320 }, { month: 'T11', revenue: 410 },
    { month: 'T12', revenue: 380 }, { month: 'T1', revenue: 290 },
    { month: 'T2', revenue: 450 }, { month: 'T3', revenue: 480 },
]
const defaultStatus = [
    { name: 'Đang chạy', value: 12, color: '#1F3A5F' },
    { name: 'Tạm dừng', value: 3, color: '#F59E0B' },
    { name: 'Hoàn thành', value: 18, color: '#22C55E' },
    { name: 'Huỷ', value: 2, color: '#EF4444' },
]

export default function DashboardCharts({ revenueData, projectStatusData }: Props) {
    const revenue = revenueData.length > 0 ? revenueData : defaultRevenue
    const status = projectStatusData.length > 0 ? projectStatusData : defaultStatus

    return (
        <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
                <div className="card-header">
                    <div className="card-title">Doanh thu theo tháng</div>
                    <span className="badge badge-primary">Triệu VND</span>
                </div>
                <div className="card-body">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1F3A5F" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1F3A5F" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8FA3BF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#8FA3BF' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
                                formatter={(v) => [`${(v as number) ?? 0}M`, 'Doanh thu']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#1F3A5F" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#1F3A5F', r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Trạng thái Dự án</div>
                    <span className="badge badge-muted">Tổng: {status.reduce((s, d) => s + d.value, 0)}</span>
                </div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                            <Pie data={status} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                dataKey="value" paddingAngle={3}>
                                {status.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => [(v as number), 'Dự án']}
                                contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {status.map((item) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: '#4A5E78' }}>{item.name}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1C2E' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
