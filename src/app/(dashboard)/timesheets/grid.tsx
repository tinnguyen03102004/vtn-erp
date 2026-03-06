'use client'

import { useState, useMemo } from 'react'
import { saveWeekTimesheets } from '@/lib/actions/timesheets'
import { useToast, ToastContainer } from '@/components/Toast'

interface TimesheetEntry {
    id: string
    projectId: string
    projectName: string
    date: string
    hours: number
    description: string | null
}

interface Project {
    id: string
    name: string
    code: string | null
}

interface Props {
    weekDates: string[]
    monday: string
    timesheets: TimesheetEntry[]
    projects: Project[]
    employeeId?: string
}

const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
const projectColors = ['#1F3A5F', '#C9A84C', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6']

export default function TimesheetGrid({ weekDates, monday, timesheets, projects, employeeId }: Props) {
    const { toasts, addToast } = useToast()
    const [saving, setSaving] = useState(false)

    const initialEntries = useMemo(() => {
        const map: Record<string, Record<string, number>> = {}
        const projectIds = new Set(timesheets.map(t => t.projectId))
        projects.forEach(p => projectIds.add(p.id))

        projectIds.forEach(pid => {
            map[pid] = {}
            weekDates.forEach((date, i) => {
                const entry = timesheets.find(t => t.projectId === pid && t.date === date)
                map[pid][String(i)] = entry?.hours ?? 0
            })
        })
        return map
    }, [timesheets, projects, weekDates])

    const [entries, setEntries] = useState(initialEntries)

    const visibleProjects = projects.filter(p => {
        const projEntries = entries[p.id]
        if (!projEntries) return false
        return Object.values(projEntries).some(h => h > 0) || true
    }).slice(0, 10)

    const totalHours = Object.values(entries).reduce((total, proj) =>
        total + Object.values(proj).reduce((s, h) => s + h, 0), 0)

    const dailyTotals = dayLabels.map((_, di) =>
        Object.values(entries).reduce((s, proj) => s + (proj[String(di)] || 0), 0)
    )

    const dateLabels = weekDates.map(d => {
        const date = new Date(d)
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    })

    async function handleSave() {
        if (!employeeId) { addToast('Không tìm thấy nhân viên', 'error'); return }
        setSaving(true)
        try {
            const allEntries: { projectId: string; date: string; hours: number }[] = []
            for (const [projectId, days] of Object.entries(entries)) {
                for (const [dayIdx, hours] of Object.entries(days)) {
                    allEntries.push({ projectId, date: weekDates[Number(dayIdx)], hours })
                }
            }
            await saveWeekTimesheets(employeeId, allEntries)
            addToast(`Đã lưu ${totalHours}h tuần này`)
        } catch (err: any) { addToast(err.message, 'error') }
        finally { setSaving(false) }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Timesheet</h1>
                    <p className="page-subtitle">
                        Tuần {dateLabels[0]} – {dateLabels[5]} — Tổng: {totalHours}h / 48h
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        {saving ? '⏳ Đang lưu...' : '💾 Lưu timesheet'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20, padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#4A5E78' }}>Tiến độ tuần</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: totalHours >= 40 ? '#22C55E' : '#F59E0B' }}>
                        {totalHours}h / 48h ({Math.round(totalHours / 48 * 100)}%)
                    </span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(100, totalHours / 48 * 100)}%` }} />
                </div>
            </div>

            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 220 }}>Dự án</th>
                                {dayLabels.map((day, i) => (
                                    <th key={day} style={{ textAlign: 'center', width: 90 }}>
                                        <div style={{ fontWeight: 700 }}>{day}</div>
                                        <div style={{ fontWeight: 400, color: '#8FA3BF', fontSize: 11 }}>{dateLabels[i]}</div>
                                    </th>
                                ))}
                                <th style={{ textAlign: 'right' }}>Tổng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProjects.map((proj, idx) => {
                                const color = projectColors[idx % projectColors.length]
                                const projTotal = Object.values(entries[proj.id] || {}).reduce((s, h) => s + h, 0)
                                return (
                                    <tr key={proj.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>{proj.name}</span>
                                            </div>
                                        </td>
                                        {dayLabels.map((_, di) => {
                                            const val = entries[proj.id]?.[String(di)] || 0
                                            return (
                                                <td key={di} style={{ textAlign: 'center', padding: '8px' }}>
                                                    <input
                                                        type="number" min="0" max="12" step="0.5"
                                                        value={val || ''} placeholder="0"
                                                        onChange={e => {
                                                            const newVal = parseFloat(e.target.value) || 0
                                                            setEntries(prev => ({
                                                                ...prev,
                                                                [proj.id]: { ...prev[proj.id], [String(di)]: newVal }
                                                            }))
                                                        }}
                                                        style={{
                                                            width: 56, height: 36, textAlign: 'center',
                                                            border: `1.5px solid ${val > 0 ? color + '60' : '#E2E8F0'}`,
                                                            borderRadius: 6, fontSize: 13, fontWeight: val > 0 ? 700 : 400,
                                                            color: val > 0 ? color : '#8FA3BF',
                                                            background: val > 0 ? color + '08' : '#fff',
                                                            outline: 'none', transition: 'all 0.15s ease',
                                                        }}
                                                    />
                                                </td>
                                            )
                                        })}
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>{projTotal}h</td>
                                    </tr>
                                )
                            })}
                            {visibleProjects.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có dự án nào</td></tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#F8F9FB' }}>
                                <td style={{ fontWeight: 700, fontSize: 13, color: '#4A5E78' }}>Tổng ngày</td>
                                {dailyTotals.map((total, i) => (
                                    <td key={i} style={{ textAlign: 'center', fontWeight: 700, color: total >= 8 ? '#22C55E' : total > 0 ? '#F59E0B' : '#CBD5E1' }}>
                                        {total > 0 ? `${total}h` : '—'}
                                    </td>
                                ))}
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#1F3A5F', fontSize: 15 }}>{totalHours}h</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    )
}
