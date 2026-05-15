'use client'

import { useState, useTransition } from 'react'
import type { TimesheetOverviewData, ApprovalSummary } from '@/lib/actions/timesheets'
import { approveTimesheets, rejectTimesheets } from '@/lib/actions/timesheets'

type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const STANDARD_HOURS_PER_DAY = 8

const STATUS_COLORS: Record<TimesheetStatus, string> = {
    DRAFT: '#6B7280',
    SUBMITTED: '#F59E0B',
    APPROVED: '#10B981',
    REJECTED: '#EF4444',
}

const STATUS_LABELS: Record<TimesheetStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
}

interface Props {
    data: TimesheetOverviewData
    availableMonths: { year: number; month: number }[]
    approvalData?: ApprovalSummary[]
}

export default function TimesheetOverview({ data, availableMonths, approvalData }: Props) {
    const [selectedYear, setSelectedYear] = useState(data.year)
    const [selectedMonth, setSelectedMonth] = useState(data.month)
    const [tab, setTab] = useState<'overview' | 'approval'>('overview')
    const [isPending, startTransition] = useTransition()

    const workDays = Math.max(1, data.daysInMonth - 8) // ~22 work days
    const targetHours = workDays * STANDARD_HOURS_PER_DAY
    const belowTarget = data.employees.filter(e => e.totalHours < targetHours * 0.8).length
    const complianceRate = data.totalEmployees > 0 ? Math.round((data.totalEmployees - belowTarget) / data.totalEmployees * 100) : 0

    const years = [...new Set(availableMonths.map(m => m.year))].sort((a, b) => b - a)
    if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear())

    // Approval stats
    const pendingApprovals = approvalData?.filter(a => a.status === 'SUBMITTED').length || 0
    const approvedCount = approvalData?.filter(a => a.status === 'APPROVED').length || 0

    function handleNavigate(year: number, month: number) {
        setSelectedYear(year)
        setSelectedMonth(month)
        window.location.href = `/timesheets?view=overview&year=${year}&month=${month}`
    }

    async function handleApprove(employeeId: string) {
        if (!confirm('Xác nhận duyệt timesheet?')) return
        startTransition(async () => {
            await approveTimesheets(employeeId, data.year, data.month)
            window.location.reload()
        })
    }

    async function handleReject(employeeId: string) {
        if (!confirm('Xác nhận từ chối timesheet?')) return
        startTransition(async () => {
            await rejectTimesheets(employeeId, data.year, data.month)
            window.location.reload()
        })
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

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(30,41,59,0.5)', borderRadius: 10, padding: 4 }}>
                <button
                    onClick={() => setTab('overview')}
                    className={`btn btn-sm ${tab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, borderRadius: 8 }}
                >
                    📊 Tổng quan giờ công
                </button>
                <button
                    onClick={() => setTab('approval')}
                    className={`btn btn-sm ${tab === 'approval' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, borderRadius: 8, position: 'relative' }}
                >
                    ✅ Duyệt Timesheet
                    {pendingApprovals > 0 && (
                        <span style={{
                            position: 'absolute', top: -4, right: -4,
                            background: '#EF4444', color: '#fff', borderRadius: '50%',
                            width: 20, height: 20, fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {pendingApprovals}
                        </span>
                    )}
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <KpiCard icon="⏱️" label="Tổng giờ tháng" value={`${data.totalHours}h`} color="#3B82F6" />
                <KpiCard icon="👥" label="NV đã chấm" value={`${data.totalEmployees}`} color="#10B981" />
                <KpiCard icon="📊" label="TB/NV" value={`${data.avgHoursPerEmployee}h`} color="#8B5CF6" />
                <KpiCard
                    icon={belowTarget > 0 ? '⚠️' : '✅'}
                    label="Dưới target (80%)"
                    value={`${belowTarget} NV`}
                    color={belowTarget > 0 ? '#F59E0B' : '#10B981'}
                />
                <KpiCard icon="🎯" label="Compliance" value={`${complianceRate}%`} color={complianceRate >= 90 ? '#10B981' : '#F59E0B'} />
                <KpiCard icon="📨" label="Chờ duyệt" value={`${pendingApprovals}`} color={pendingApprovals > 0 ? '#F59E0B' : '#10B981'} />
                <KpiCard icon="✅" label="Đã duyệt" value={`${approvedCount}`} color="#10B981" />
            </div>

            {/* Tab Content */}
            {tab === 'overview' ? (
                <OverviewTable data={data} workDays={workDays} targetHours={targetHours} />
            ) : (
                <ApprovalTable
                    approvalData={approvalData || []}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isPending={isPending}
                />
            )}
        </div>
    )
}

function OverviewTable({ data, workDays, targetHours }: { data: TimesheetOverviewData; workDays: number; targetHours: number }) {
    return (
        <div className="card" style={{ overflowX: 'auto' }}>
            <div className="card-header" style={{ paddingBottom: 16 }}>
                <div className="card-title">Chi tiết theo nhân viên</div>
                <span className="badge badge-muted">{data.employees.length} nhân viên</span>
            </div>
            {data.employees.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <p>Chưa có dữ liệu timesheet.</p>
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
    )
}

function ApprovalTable({ approvalData, onApprove, onReject, isPending }: {
    approvalData: ApprovalSummary[]
    onApprove: (empId: string) => void
    onReject: (empId: string) => void
    isPending: boolean
}) {
    if (approvalData.length === 0) {
        return (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p>Chưa có timesheet cần duyệt trong tháng này.</p>
            </div>
        )
    }

    return (
        <div className="card" style={{ overflowX: 'auto' }}>
            <div className="card-header" style={{ paddingBottom: 16 }}>
                <div className="card-title">Duyệt Timesheet nhân viên</div>
                <span className="badge badge-muted">{approvalData.length} nhân viên</span>
            </div>
            <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
                <thead>
                    <tr>
                        <th>Nhân viên</th>
                        <th>Phòng ban</th>
                        <th style={{ textAlign: 'right' }}>Tổng giờ</th>
                        <th style={{ textAlign: 'center' }}>Nháp</th>
                        <th style={{ textAlign: 'center' }}>Đã gửi</th>
                        <th style={{ textAlign: 'center' }}>Đã duyệt</th>
                        <th style={{ textAlign: 'center' }}>Từ chối</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {approvalData.map(emp => (
                        <tr key={emp.employeeId}>
                            <td>
                                <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{emp.name}</div>
                            </td>
                            <td style={{ color: '#8FA3BF', fontSize: 13 }}>{emp.department}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#E2E8F0' }}>
                                {emp.totalHours}h
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <CountBadge count={emp.draftCount} color="#6B7280" />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <CountBadge count={emp.submittedCount} color="#F59E0B" />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <CountBadge count={emp.approvedCount} color="#10B981" />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <CountBadge count={emp.rejectedCount} color="#EF4444" />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: `${STATUS_COLORS[emp.status]}20`,
                                    color: STATUS_COLORS[emp.status],
                                }}>
                                    {STATUS_LABELS[emp.status]}
                                </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                    {emp.submittedCount > 0 && (
                                        <>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => onApprove(emp.employeeId)}
                                                disabled={isPending}
                                                style={{
                                                    background: 'rgba(16,185,129,0.15)',
                                                    color: '#10B981',
                                                    border: '1px solid rgba(16,185,129,0.3)',
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                }}
                                            >
                                                ✅ Duyệt
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => onReject(emp.employeeId)}
                                                disabled={isPending}
                                                style={{
                                                    background: 'rgba(239,68,68,0.15)',
                                                    color: '#EF4444',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                }}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </>
                                    )}
                                    {emp.status === 'APPROVED' && (
                                        <span style={{ color: '#10B981', fontSize: 12 }}>✓ Đã duyệt</span>
                                    )}
                                    {emp.status === 'DRAFT' && emp.submittedCount === 0 && (
                                        <span style={{ color: '#6B7280', fontSize: 12 }}>Chưa gửi</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function CountBadge({ count, color }: { count: number; color: string }) {
    if (count === 0) return <span style={{ color: '#475569', fontSize: 12 }}>—</span>
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            background: `${color}20`,
            color,
            minWidth: 24,
        }}>
            {count}
        </span>
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
