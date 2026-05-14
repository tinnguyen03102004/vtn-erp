'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveWeekTimesheets } from '@/lib/actions/timesheets'
import { useToast, ToastContainer } from '@/components/Toast'

interface TimesheetEntry {
    id: string; projectId: string; projectName: string
    employeeName: string; employeeId: string
    date: string; hours: number; description: string | null
}
interface Project { id: string; name: string; code: string | null }
interface Stats {
    totalEmployees: number; totalHoursAll: number; totalProjects: number
    totalDays: number; myTotalHours: number; myProjects: number
    myDays: number; avgHoursPerEmployee: number; belowTarget: number
}
interface Props {
    weekDates: string[]; monday: string; timesheets: TimesheetEntry[]
    projects: Project[]; employeeId?: string; isManager?: boolean
    prevWeek: string; nextWeek: string; isCurrentWeek: boolean; stats: Stats
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
const COLORS = ['#1F3A5F', '#C9A84C', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6']
const EMP_COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6']
const TARGET_HOURS = 48

export default function TimesheetView({
    weekDates, monday: _monday, timesheets, projects, employeeId,
    isManager, prevWeek, nextWeek, isCurrentWeek, stats,
}: Props) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'my' | 'team'>('my')
    const [teamSearch, setTeamSearch] = useState('')

    const dateLabels = weekDates.map(d => {
        const dt = new Date(d)
        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`
    })

    // Employee editable grid state
    const initialEntries = useMemo(() => {
        const map: Record<string, Record<string, number>> = {}
        const pids = new Set(timesheets.map(t => t.projectId))
        projects.forEach(p => pids.add(p.id))
        pids.forEach(pid => {
            map[pid] = {}
            weekDates.forEach((date, i) => {
                const e = timesheets.find(t => t.projectId === pid && t.date === date)
                map[pid][String(i)] = e?.hours ?? 0
            })
        })
        return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timesheets, projects, weekDates])

    const [entries, setEntries] = useState(initialEntries)

    const visibleProjects = projects.filter(p => entries[p.id]).slice(0, 10)
    const totalHours = Object.values(entries).reduce((t, proj) =>
        t + Object.values(proj).reduce((s, h) => s + h, 0), 0)
    const dailyTotals = DAY_LABELS.map((_, di) =>
        Object.values(entries).reduce((s, proj) => s + (proj[String(di)] || 0), 0))

    // Manager data
    const employeeMap = useMemo(() => {
        const m = new Map<string, { name: string; entries: TimesheetEntry[] }>()
        for (const t of timesheets) {
            const k = t.employeeId || 'unknown'
            if (!m.has(k)) m.set(k, { name: t.employeeName || '-', entries: [] })
            m.get(k)!.entries.push(t)
        }
        return m
    }, [timesheets])

    const employeeList = useMemo(() => {
        return Array.from(employeeMap.entries())
            .map(([id, data]) => {
                const daily = weekDates.map(date =>
                    data.entries.filter(t => t.date === date).reduce((s, t) => s + t.hours, 0))
                return { id, name: data.name, dailyHours: daily, weekTotal: daily.reduce((s, h) => s + h, 0), entries: data.entries }
            })
            .filter(e => !teamSearch || e.name.toLowerCase().includes(teamSearch.toLowerCase()))
            .sort((a, b) => b.weekTotal - a.weekTotal)
    }, [employeeMap, weekDates, teamSearch])

    const grandTotal = employeeList.reduce((s, e) => s + e.weekTotal, 0)
    const dailyGrandTotals = weekDates.map((_, di) => employeeList.reduce((s, e) => s + e.dailyHours[di], 0))

    async function handleSave() {
        if (!employeeId) { addToast('Không tìm thấy nhân viên', 'error'); return }
        setSaving(true)
        try {
            const all: { projectId: string; date: string; hours: number }[] = []
            for (const [projectId, days] of Object.entries(entries)) {
                for (const [dayIdx, hours] of Object.entries(days)) {
                    all.push({ projectId, date: weekDates[Number(dayIdx)], hours })
                }
            }
            const result = await saveWeekTimesheets(employeeId, all)
            if (!result.success) { addToast(result.error || 'Lưu thất bại', 'error'); return }
            addToast(`✅ Đã lưu ${totalHours}h tuần này`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lỗi', 'error') }
        finally { setSaving(false) }
    }

    const pct = Math.round(totalHours / TARGET_HOURS * 100)
    const teamPct = stats.totalEmployees > 0
        ? Math.round(stats.totalHoursAll / (stats.totalEmployees * TARGET_HOURS) * 100) : 0

    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Page Header + Week Nav */}
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Timesheet</h1>
                    <p className="page-subtitle">Quản lý chấm công theo dự án & giờ làm việc</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => router.push(`/timesheets?week=${prevWeek}`)}>
                        ← Tuần trước
                    </button>
                    {!isCurrentWeek && (
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/timesheets')}>
                            Tuần hiện tại
                        </button>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => router.push(`/timesheets?week=${nextWeek}`)}>
                        Tuần sau →
                    </button>
                    {activeTab === 'my' && (
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳ Đang lưu...' : '💾 Lưu timesheet'}
                        </button>
                    )}
                </div>
            </div>

            {/* Week Indicator */}
            <div className="flex items-center gap-2 mb-4">
                <span className={`badge ${isCurrentWeek ? 'badge-success' : 'badge-info'}`}>
                    {isCurrentWeek ? '📅 Tuần hiện tại' : '📅 Tuần khác'}
                </span>
                <span className="text-sm text-secondary font-semibold">
                    {dateLabels[0]} – {dateLabels[5]}
                </span>
            </div>

            {/* KPI Cards */}
            <div className="grid-4 mb-6">
                <div className="kpi-card">
                    <div className="kpi-label">Tổng giờ tuần</div>
                    <div className="kpi-value" style={{ color: totalHours >= 40 ? '#22C55E' : totalHours > 0 ? '#F59E0B' : undefined }}>
                        {activeTab === 'team' ? `${stats.totalHoursAll}h` : `${totalHours}h`}
                    </div>
                    <div className="kpi-meta">
                        Mục tiêu: {activeTab === 'team' ? `${stats.totalEmployees * TARGET_HOURS}h` : `${TARGET_HOURS}h`}
                        {' · '}
                        <span style={{ fontWeight: 700, color: (activeTab === 'team' ? teamPct : pct) >= 80 ? '#22C55E' : '#F59E0B' }}>
                            {activeTab === 'team' ? teamPct : pct}%
                        </span>
                    </div>
                    <div className="kpi-icon" style={{ background: '#EFF3FA' }}>⏰</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">{activeTab === 'team' ? 'Nhân viên' : 'Dự án tham gia'}</div>
                    <div className="kpi-value">
                        {activeTab === 'team' ? stats.totalEmployees : stats.myProjects}
                    </div>
                    <div className="kpi-meta">
                        {activeTab === 'team' ? `${stats.belowTarget} chưa đủ giờ` : `Tổng ${projects.length} dự án`}
                    </div>
                    <div className="kpi-icon" style={{ background: '#FBF5E6' }}>
                        {activeTab === 'team' ? '👥' : '📁'}
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">{activeTab === 'team' ? 'TB giờ/người' : 'Ngày đã ghi'}</div>
                    <div className="kpi-value">
                        {activeTab === 'team' ? `${stats.avgHoursPerEmployee}h` : `${stats.myDays}/6`}
                    </div>
                    <div className="kpi-meta">
                        {activeTab === 'team' ? `Mục tiêu ${TARGET_HOURS}h/người` : 'Thứ 2 – Thứ 7'}
                    </div>
                    <div className="kpi-icon" style={{ background: '#F0FDF4' }}>📊</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Tỷ lệ hoàn thành</div>
                    <div className="kpi-value" style={{ color: (activeTab === 'team' ? teamPct : pct) >= 80 ? '#22C55E' : '#F59E0B' }}>
                        {activeTab === 'team' ? teamPct : pct}%
                    </div>
                    <div className="progress" style={{ marginTop: 8, height: 8 }}>
                        <div className="progress-bar" style={{ width: `${Math.min(100, activeTab === 'team' ? teamPct : pct)}%` }} />
                    </div>
                    <div className="kpi-icon" style={{ background: '#EDE9FE' }}>🎯</div>
                </div>
            </div>

            {/* Tabs */}
            {isManager && (
                <div className="tabs mb-4">
                    <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
                        📝 Timesheet của tôi
                    </button>
                    <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                        👥 Tổng quan đội nhóm
                    </button>
                </div>
            )}

            {/* ========== MY TIMESHEET TAB ========== */}
            {activeTab === 'my' && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <div className="card-title">Bảng chấm công theo dự án</div>
                        <span className="badge badge-primary">{visibleProjects.length} dự án</span>
                    </div>
                    <div className="card-body" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ minWidth: 700 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: 200 }}>Dự án</th>
                                    {DAY_LABELS.map((day, i) => (
                                        <th key={day} style={{ textAlign: 'center', width: 85 }}>
                                            <div style={{ fontWeight: 700 }}>{day}</div>
                                            <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.6 }}>{dateLabels[i]}</div>
                                        </th>
                                    ))}
                                    <th style={{ textAlign: 'right', width: 70 }}>Tổng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleProjects.map((proj, idx) => {
                                    const color = COLORS[idx % COLORS.length]
                                    const projTotal = Object.values(entries[proj.id] || {}).reduce((s, h) => s + h, 0)
                                    return (
                                        <tr key={proj.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                                                    <span className="font-semibold text-sm truncate">{proj.name}</span>
                                                </div>
                                            </td>
                                            {DAY_LABELS.map((_, di) => {
                                                const val = entries[proj.id]?.[String(di)] || 0
                                                return (
                                                    <td key={di} style={{ textAlign: 'center', padding: 6 }}>
                                                        <input
                                                            type="number" min="0" max="12" step="0.5"
                                                            className="form-input"
                                                            value={val || ''} placeholder="0"
                                                            onChange={e => {
                                                                const v = parseFloat(e.target.value) || 0
                                                                setEntries(prev => ({
                                                                    ...prev,
                                                                    [proj.id]: { ...prev[proj.id], [String(di)]: v }
                                                                }))
                                                            }}
                                                            style={{
                                                                width: 56, height: 34, textAlign: 'center',
                                                                padding: '4px 6px', fontSize: 13,
                                                                fontWeight: val > 0 ? 700 : 400,
                                                                borderColor: val > 0 ? color + '60' : undefined,
                                                                color: val > 0 ? color : '#8FA3BF',
                                                                background: val > 0 ? color + '08' : undefined,
                                                            }}
                                                        />
                                                    </td>
                                                )
                                            })}
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="font-bold" style={{ color: projTotal > 0 ? '#1F3A5F' : '#CBD5E1' }}>
                                                    {projTotal > 0 ? `${projTotal}h` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {visibleProjects.length === 0 && (
                                    <tr>
                                        <td colSpan={8}>
                                            <div className="empty-state" style={{ padding: 40 }}>
                                                <div className="empty-state-icon">📋</div>
                                                <div className="empty-state-title">Chưa có dự án nào</div>
                                                <div className="empty-state-desc">Các dự án đang hoạt động sẽ xuất hiện ở đây</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {visibleProjects.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td className="font-bold text-sm" style={{ color: '#4A5E78' }}>Tổng ngày</td>
                                        {dailyTotals.map((total, i) => (
                                            <td key={i} style={{ textAlign: 'center' }}>
                                                <span className="font-bold" style={{
                                                    color: total >= 8 ? '#22C55E' : total > 0 ? '#F59E0B' : '#CBD5E1'
                                                }}>
                                                    {total > 0 ? `${total}h` : '—'}
                                                </span>
                                            </td>
                                        ))}
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: 800, color: '#1F3A5F', fontSize: 15 }}>{totalHours}h</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ========== TEAM OVERVIEW TAB ========== */}
            {activeTab === 'team' && isManager && (
                <div className="animate-fade-in">
                    {/* Team Progress Bar */}
                    <div className="card mb-4" style={{ padding: '16px 24px' }}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold" style={{ color: '#4A5E78' }}>Tổng giờ đội nhóm</span>
                            <span className="text-sm font-bold" style={{
                                color: grandTotal >= employeeList.length * 40 ? '#22C55E' : '#F59E0B'
                            }}>
                                {grandTotal}h / {employeeList.length * TARGET_HOURS}h ({teamPct}%)
                            </span>
                        </div>
                        <div className="progress" style={{ height: 10 }}>
                            <div className="progress-bar" style={{ width: `${Math.min(100, teamPct)}%` }} />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Tổng quan đội nhóm</div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="🔍 Tìm nhân viên..."
                                    value={teamSearch}
                                    onChange={e => setTeamSearch(e.target.value)}
                                    style={{ width: 200, height: 34, fontSize: 13 }}
                                />
                                <span className="badge badge-muted">{employeeList.length} người</span>
                            </div>
                        </div>
                        <div className="card-body" style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 700 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 220 }}>Nhân viên</th>
                                        {DAY_LABELS.map((day, i) => (
                                            <th key={day} style={{ textAlign: 'center', width: 85 }}>
                                                <div style={{ fontWeight: 700 }}>{day}</div>
                                                <div style={{ fontWeight: 400, fontSize: 10, opacity: 0.6 }}>{dateLabels[i]}</div>
                                            </th>
                                        ))}
                                        <th style={{ textAlign: 'center', width: 80 }}>Tổng</th>
                                        <th style={{ textAlign: 'center', width: 90 }}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeList.map((emp, idx) => {
                                        const c = EMP_COLORS[idx % EMP_COLORS.length]
                                        const status = emp.weekTotal >= 40 ? 'success' : emp.weekTotal >= 32 ? 'warning' : emp.weekTotal > 0 ? 'danger' : 'muted'
                                        const statusLabel = emp.weekTotal >= 40 ? 'Đủ giờ' : emp.weekTotal >= 32 ? 'Gần đủ' : emp.weekTotal > 0 ? 'Thiếu' : 'Trống'
                                        return (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="avatar avatar-sm" style={{ background: c + '20', color: c }}>
                                                            {emp.name.split(' ').pop()?.charAt(0) ?? '?'}
                                                        </div>
                                                        <span className="font-semibold text-sm">{emp.name}</span>
                                                    </div>
                                                </td>
                                                {emp.dailyHours.map((h, di) => (
                                                    <td key={di} style={{
                                                        textAlign: 'center', fontWeight: h > 0 ? 700 : 400,
                                                        color: h >= 8 ? '#22C55E' : h > 0 ? '#C9A84C' : '#CBD5E1',
                                                        background: h > 0 ? (h >= 8 ? '#F0FDF4' : '#FFFBEB') : undefined,
                                                        fontSize: 13,
                                                    }}>
                                                        {h > 0 ? `${h}h` : '—'}
                                                    </td>
                                                ))}
                                                <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 14,
                                                    color: emp.weekTotal >= 40 ? '#22C55E' : emp.weekTotal >= 32 ? '#C9A84C' : '#EF4444'
                                                }}>
                                                    {emp.weekTotal}h
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`badge badge-${status}`}>{statusLabel}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {employeeList.length === 0 && (
                                        <tr>
                                            <td colSpan={9}>
                                                <div className="empty-state" style={{ padding: 40 }}>
                                                    <div className="empty-state-icon">📋</div>
                                                    <div className="empty-state-title">
                                                        {teamSearch ? 'Không tìm thấy nhân viên' : 'Chưa có dữ liệu'}
                                                    </div>
                                                    <div className="empty-state-desc">
                                                        {teamSearch ? 'Thử tìm với từ khóa khác' : 'Chưa có dữ liệu timesheet tuần này'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {employeeList.length > 0 && (
                                    <tfoot>
                                        <tr style={{ background: 'var(--color-surface)' }}>
                                            <td className="font-bold text-sm" style={{ color: '#4A5E78' }}>Tổng ngày</td>
                                            {dailyGrandTotals.map((total, i) => (
                                                <td key={i} style={{ textAlign: 'center', fontWeight: 700,
                                                    color: total > 0 ? '#1F3A5F' : '#CBD5E1'
                                                }}>
                                                    {total > 0 ? `${total}h` : '—'}
                                                </td>
                                            ))}
                                            <td style={{ textAlign: 'center', fontWeight: 800, color: '#1F3A5F', fontSize: 15 }}>
                                                {grandTotal}h
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
