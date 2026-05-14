'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CostAllocationResult, ProjectCostSummary } from '@/lib/actions/project-costs'

const stateLabels: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Đang thực hiện', color: '#22C55E' },
    COMPLETED: { label: 'Hoàn thành', color: '#3B82F6' },
    DRAFT: { label: 'Nháp', color: '#8FA3BF' },
    ON_HOLD: { label: 'Tạm dừng', color: '#F59E0B' },
    CANCELLED: { label: 'Đã hủy', color: '#EF4444' },
}

const projectColors = [
    '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6',
    '#22C55E', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4',
]

function formatVnd(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
    return amount.toLocaleString('vi-VN')
}

function formatVndFull(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ'
}

export default function CostAllocationView({ data }: { data: CostAllocationResult }) {
    const router = useRouter()
    const [expandedProject, setExpandedProject] = useState<string | null>(null)

    // Month selector
    const now = new Date()
    const months = []
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `T${d.getMonth() + 1}/${d.getFullYear()}` })
    }

    function handleMonthChange(yearMonth: string) {
        const [y, m] = yearMonth.split('-')
        router.push(`/finance/costs?year=${y}&month=${m}`)
    }

    // Current selected
    const periodParts = data.period.startDate.split('-')
    const currentYM = `${periodParts[0]}-${parseInt(periodParts[1])}`

    return (
        <>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Chi phí phân bổ dự án</h1>
                    <p className="page-subtitle">
                        {data.period.label} — {data.projects.length} dự án — Tổng: {formatVndFull(data.grandTotalCost)}
                    </p>
                </div>
                <div className="page-actions">
                    <select
                        className="btn btn-sm"
                        value={currentYM}
                        onChange={e => handleMonthChange(e.target.value)}
                        style={{ cursor: 'pointer', minWidth: 130 }}
                    >
                        {months.map(m => (
                            <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <SummaryCard
                    icon="💰" label="Tổng chi phí"
                    value={formatVndFull(data.grandTotalCost)}
                    color="#6366F1"
                />
                <SummaryCard
                    icon="⏱️" label="Tổng giờ công"
                    value={`${data.grandTotalHours}h`}
                    color="#14B8A6"
                />
                <SummaryCard
                    icon="📊" label="Dự án có chi phí"
                    value={`${data.projects.length}`}
                    color="#F59E0B"
                />
                <SummaryCard
                    icon="👤" label="Chi phí TB/dự án"
                    value={data.projects.length > 0 ? formatVndFull(Math.round(data.grandTotalCost / data.projects.length)) : '0đ'}
                    color="#EC4899"
                />
            </div>

            {/* Cost Bar Chart */}
            {data.projects.length > 0 && (
                <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#4A5E78', marginBottom: 16 }}>
                        Phân bổ chi phí theo dự án
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {data.projects.slice(0, 8).map((proj, idx) => {
                            const pct = data.grandTotalCost > 0 ? (proj.totalCost / data.grandTotalCost * 100) : 0
                            const color = projectColors[idx % projectColors.length]
                            return (
                                <div key={proj.projectId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 160, fontSize: 13, fontWeight: 600, color: '#1F3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {proj.projectName}
                                    </div>
                                    <div style={{ flex: 1, height: 24, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                                        <div style={{
                                            width: `${Math.max(pct, 2)}%`, height: '100%',
                                            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                                            borderRadius: 6, transition: 'width 0.5s ease',
                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                                        }}>
                                            {pct > 15 && (
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                                    {formatVnd(proj.totalCost)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ width: 50, fontSize: 12, fontWeight: 700, color: '#4A5E78', textAlign: 'right' }}>
                                        {pct.toFixed(1)}%
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Project Detail Table */}
            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th>Dự án</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ textAlign: 'center' }}>Nhân sự</th>
                                <th style={{ textAlign: 'right' }}>Giờ công</th>
                                <th style={{ textAlign: 'right' }}>Chi phí</th>
                                <th style={{ textAlign: 'right' }}>% Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.projects.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: '#8FA3BF', padding: 40 }}>
                                        Chưa có dữ liệu chi phí cho {data.period.label}
                                    </td>
                                </tr>
                            )}
                            {data.projects.map((proj, idx) => (
                                <ProjectRow
                                    key={proj.projectId}
                                    project={proj}
                                    colorIdx={idx}
                                    grandTotal={data.grandTotalCost}
                                    isExpanded={expandedProject === proj.projectId}
                                    onToggle={() => setExpandedProject(
                                        expandedProject === proj.projectId ? null : proj.projectId
                                    )}
                                />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#F8F9FB' }}>
                                <td></td>
                                <td style={{ fontWeight: 700, fontSize: 13, color: '#4A5E78' }}>Tổng cộng</td>
                                <td></td>
                                <td></td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>{data.grandTotalHours}h</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#6366F1', fontSize: 14 }}>
                                    {formatVndFull(data.grandTotalCost)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#4A5E78' }}>100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    )
}

function ProjectRow({
    project, colorIdx, grandTotal, isExpanded, onToggle,
}: {
    project: ProjectCostSummary
    colorIdx: number
    grandTotal: number
    isExpanded: boolean
    onToggle: () => void
}) {
    const color = projectColors[colorIdx % projectColors.length]
    const pct = grandTotal > 0 ? (project.totalCost / grandTotal * 100) : 0
    const state = stateLabels[project.projectState] || stateLabels.DRAFT

    return (
        <>
            <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
                <td style={{ textAlign: 'center', fontSize: 14 }}>
                    {isExpanded ? '▼' : '▶'}
                </td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: color, flexShrink: 0,
                        }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1F3A5F' }}>{project.projectName}</span>
                    </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                    <span style={{
                        display: 'inline-block',
                        background: state.color + '15', color: state.color,
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    }}>
                        {state.label}
                    </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{project.employees.length}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{project.totalHours}h</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>
                    {formatVndFull(project.totalCost)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: pct >= 20 ? '#EF4444' : '#4A5E78' }}>
                    {pct.toFixed(1)}%
                </td>
            </tr>
            {isExpanded && project.employees.map(emp => (
                <tr key={emp.employeeId} style={{ background: '#FAFBFC' }}>
                    <td></td>
                    <td style={{ paddingLeft: 36 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: color + '20', color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                            }}>
                                {emp.employeeName.split(' ').pop()?.charAt(0) ?? '?'}
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#4A5E78' }}>{emp.employeeName}</div>
                                <div style={{ fontSize: 11, color: '#8FA3BF' }}>{emp.department}</div>
                            </div>
                        </div>
                    </td>
                    <td></td>
                    <td style={{ textAlign: 'center', fontSize: 12, color: '#8FA3BF' }}>
                        {formatVndFull(emp.hourlyRate)}/h
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13 }}>{emp.hours}h</td>
                    <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#4A5E78' }}>
                        {formatVndFull(emp.cost)}
                    </td>
                    <td></td>
                </tr>
            ))}
        </>
    )
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: color + '15', color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: 11, color: '#8FA3BF', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F' }}>{value}</div>
                </div>
            </div>
        </div>
    )
}
