'use client'

import { useState } from 'react'
import type { TimesheetOverviewData } from '@/lib/actions/timesheets'

const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const STANDARD_HOURS_PER_DAY = 8

interface Props {
    data: TimesheetOverviewData
    availableMonths: { year: number; month: number }[]
}

export default function TimesheetOverview({ data, availableMonths }: Props) {
    const [selectedYear, setSelectedYear] = useState(data.year)
    const [selectedMonth, setSelectedMonth] = useState(data.month)

    const workDays = Math.max(1, data.daysInMonth - 8) // ~22 work days
    const targetHours = workDays * STANDARD_HOURS_PER_DAY
    const belowTarget = data.employees.filter(e => e.totalHours < targetHours * 0.8).length
    const complianceRate = data.totalEmployees > 0 ? Math.round((data.totalEmployees - belowTarget) / data.totalEmployees * 100) : 0

    const years = [...new Set(availableMonths.map(m => m.year))].sort((a, b) => b - a)
    if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear())

    function handleNavigate(year: number, month: number) {
        setSelectedYear(year)
        setSelectedMonth(month)
        // Navigate with URL params
        window.location.href = `/timesheets?view=overview&year=${year}&month=${month}`
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">📊 Tổng quan Timesheet</h1>
                    <p className="page-subtitle">{MONTH_NAMES[data.month]} / {data.year} — Dữ liệu toàn công ty</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* Month/Year navigation */}
                    <select
                        className="input"
                        value={selectedMonth}
                        onChange={e => handleNavigate(selectedYear, Number(e.target.value))}
                        style={{ minWidth: 120, fontSize: 13 }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{MONTH_NAMES[i + 1]}</option>
                        ))}
                    </select>
                    <select
                        className="input"
                        value={selectedYear}
                        onChange={e => handleNavigate(Number(e.target.value), selectedMonth)}
                        style={{ minWidth: 90, fontSize: 13 }}
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <a
                        href="/timesheets"
                        className="btn btn-outline btn-sm"
                        style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
                    >
                        📋 Xem tuần
                    </a>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <KpiCard icon="⏱️" label="Tổng giờ tháng" value={`${data.totalHours}h`} color="#3B82F6" />
                <KpiCard icon="👥" label="NV đã chấm" value={`${data.totalEmployees}`} color="#10B981" />
                <KpiCard icon="📊" label="TB/NV" value={`${data.avgHoursPerEmployee}h`} color="#8B5CF6" />
                <KpiCard
                    icon={belowTarget > 0 ? '⚠️' : '✅'}
                    label="Dưới target (80%)"
                    value={`${belowTarget} NV`}
                    color={belowTarget > 0 ? '#F59E0B' : '#10B981'}
                />
                <KpiCard icon="🎯" label="Tỷ lệ compliance" value={`${complianceRate}%`} color={complianceRate >= 90 ? '#10B981' : '#F59E0B'} />
            </div>

            {/* Employee Table */}
            <div className="card" style={{ overflowX: 'auto' }}>
                <div className="card-header" style={{ paddingBottom: 16 }}>
                    <div className="card-title">Chi tiết theo nhân viên</div>
                    <span className="badge badge-muted">{data.employees.length} nhân viên</span>
                </div>
                {data.employees.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <p>Chưa có dữ liệu timesheet cho {MONTH_NAMES[data.month]} / {data.year}.</p>
                    </div>
                ) : (
                    <table className="data-table" style={{ width: '100%', minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Phòng ban</th>
                                <th style={{ textAlign: 'center' }}>Ngày làm</th>
                                <th style={{ textAlign: 'right' }}>Tổng giờ</th>
                                <th style={{ textAlign: 'right' }}>TB/ngày</th>
                                <th>Tiến độ</th>
                                <th>Dự án</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.employees.map(emp => {
                                const avgPerDay = emp.daysWorked > 0 ? Math.round(emp.totalHours / emp.daysWorked * 10) / 10 : 0
                                const progress = Math.min(100, Math.round(emp.totalHours / targetHours * 100))
                                const isBelow = progress < 80

                                return (
                                    <tr key={emp.employeeId}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{emp.name}</div>
                                        </td>
                                        <td style={{ color: '#8FA3BF', fontSize: 13 }}>{emp.department}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{emp.daysWorked}</span>
                                            <span style={{ fontSize: 11, color: '#475569' }}>/{workDays}</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>
                                            {emp.totalHours}h
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: avgPerDay >= 8 ? '#10B981' : '#F59E0B' }}>
                                            {avgPerDay}h
                                        </td>
                                        <td style={{ minWidth: 140 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress" style={{ flex: 1 }}>
                                                    <div
                                                        className="progress-bar"
                                                        style={{
                                                            width: `${progress}%`,
                                                            background: isBelow ? '#F59E0B' : progress >= 100 ? '#10B981' : '#3B82F6',
                                                            transition: 'width 0.5s ease',
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: isBelow ? '#F59E0B' : '#10B981', minWidth: 32, textAlign: 'right' }}>
                                                    {progress}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {emp.projects.slice(0, 3).map(p => (
                                                    <span key={p} style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, background: 'rgba(59,130,246,0.1)', color: '#60A5FA', whiteSpace: 'nowrap' }}>
                                                        {p}
                                                    </span>
                                                ))}
                                                {emp.projects.length > 3 && (
                                                    <span style={{ fontSize: 11, color: '#475569' }}>+{emp.projects.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid rgba(148, 163, 184, 0.2)', fontWeight: 700 }}>
                                <td style={{ color: '#E2E8F0' }}>Tổng cộng ({data.employees.length} NV)</td>
                                <td></td>
                                <td></td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10B981' }}>
                                    {data.totalHours}h
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#8FA3BF' }}>
                                    {data.avgHoursPerEmployee}h
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    )
}

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 4, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
        </div>
    )
}
