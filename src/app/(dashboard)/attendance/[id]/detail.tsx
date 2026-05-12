'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updatePeriodState, reviewAttendanceRecord } from '@/lib/actions/attendance'
import { useToast, ToastContainer } from '@/components/Toast'

interface Employee {
    employeeId: string
    employeeName: string
    machineCode: string | null
    workDays: number
    avgHours: number
    pendingCount: number
}

interface AttRecord {
    id: string
    periodId: string
    employeeId: string
    date: string
    checkIn: string | null
    checkOut: string | null
    workHours: number
    source: string
    note: string | null
    state: string
}

interface Period {
    id: string
    name: string
    startDate: string
    endDate: string
    state: string
}

const stateColors: Record<string, string> = {
    ORIGINAL: '#22C55E',
    PENDING: '#F59E0B',
    APPROVED: '#3B82F6',
    REJECTED: '#EF4444',
}

const stateLabels: Record<string, string> = {
    ORIGINAL: 'Máy chấm',
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
}

export default function PeriodDetail({
    period,
    employees,
    records,
}: {
    period: Period
    employees: Employee[]
    records: AttRecord[]
}) {
    const { toasts, addToast } = useToast()
    const [currentState, setCurrentState] = useState(period.state)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [recordStates, setRecordStates] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    const employeeRecords = selectedEmployee
        ? records.filter(r => r.employeeId === selectedEmployee)
        : []

    const selectedEmpInfo = employees.find(e => e.employeeId === selectedEmployee)

    async function handleStateChange(newState: 'DRAFT' | 'REVIEW' | 'LOCKED') {
        setLoading(true)
        const result = await updatePeriodState(period.id, newState)
        if (!result.success) {
            addToast(result.error || 'Thất bại', 'error')
        } else {
            setCurrentState(newState)
            addToast(`✅ Đã chuyển sang ${newState === 'LOCKED' ? 'Đã khóa' : newState === 'REVIEW' ? 'Đang review' : 'Nháp'}`)
        }
        setLoading(false)
    }

    async function handleReview(recordId: string, action: 'APPROVED' | 'REJECTED') {
        const result = await reviewAttendanceRecord(recordId, action)
        if (!result.success) {
            addToast(result.error || 'Thất bại', 'error')
        } else {
            setRecordStates(prev => ({ ...prev, [recordId]: action }))
            addToast(action === 'APPROVED' ? '✅ Đã duyệt' : '❌ Đã từ chối')
        }
    }

    const getDayName = (dateStr: string) => {
        const d = new Date(dateStr)
        const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        return names[d.getDay()]
    }

    const formatTime = (t: string | null) => {
        if (!t) return '—'
        return t.substring(0, 5)
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/attendance" style={{ fontSize: 13, color: '#8FA3BF', textDecoration: 'none' }}>
                        ← Chấm công
                    </Link>
                    <h1 className="page-title">{period.name}</h1>
                    <p className="page-subtitle">
                        {period.startDate} → {period.endDate} — {employees.length} nhân viên
                    </p>
                </div>
                <div className="page-actions" style={{ display: 'flex', gap: 8 }}>
                    {currentState === 'DRAFT' && (
                        <button className="btn btn-sm" onClick={() => handleStateChange('REVIEW')} disabled={loading}>
                            👁️ Mở review
                        </button>
                    )}
                    {currentState === 'REVIEW' && (
                        <>
                            <button className="btn btn-sm" onClick={() => handleStateChange('DRAFT')} disabled={loading}>
                                ↩️ Về nháp
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleStateChange('LOCKED')} disabled={loading}>
                                🔒 Khóa kỳ
                            </button>
                        </>
                    )}
                    {currentState === 'LOCKED' && (
                        <span style={{
                            background: '#22C55E15', color: '#22C55E',
                            padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        }}>🔒 Đã khóa</span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '300px 1fr' : '1fr', gap: 16 }}>
                {/* Employee list */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1F3A5F' }}>Nhân viên</span>
                    </div>
                    <div style={{ maxHeight: 500, overflow: 'auto' }}>
                        {employees.map(emp => (
                            <div
                                key={emp.employeeId}
                                onClick={() => setSelectedEmployee(emp.employeeId)}
                                style={{
                                    padding: '12px 20px',
                                    cursor: 'pointer',
                                    background: selectedEmployee === emp.employeeId ? '#EFF6FF' : 'transparent',
                                    borderBottom: '1px solid #F1F5F9',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1F3A5F' }}>
                                            {emp.employeeName}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#8FA3BF' }}>
                                            Mã: {emp.machineCode || '—'} • {emp.workDays} ngày • {emp.avgHours}h/ngày
                                        </div>
                                    </div>
                                    {emp.pendingCount > 0 && (
                                        <span style={{
                                            background: '#FEF3C7', color: '#D97706',
                                            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                                        }}>{emp.pendingCount}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {employees.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: '#8FA3BF', fontSize: 13 }}>
                                Chưa có dữ liệu chấm công
                            </div>
                        )}
                    </div>
                </div>

                {/* Employee records detail */}
                {selectedEmployee && (
                    <div className="card">
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F' }}>
                                    {selectedEmpInfo?.employeeName}
                                </div>
                                <div style={{ fontSize: 12, color: '#8FA3BF' }}>
                                    Mã máy: {selectedEmpInfo?.machineCode || '—'} • {selectedEmpInfo?.workDays} ngày công • Giờ TB: {selectedEmpInfo?.avgHours}h
                                </div>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: 100 }}>Ngày</th>
                                        <th style={{ width: 40, textAlign: 'center' }}>Thứ</th>
                                        <th style={{ textAlign: 'center' }}>Giờ vào</th>
                                        <th style={{ textAlign: 'center' }}>Giờ ra</th>
                                        <th style={{ textAlign: 'center' }}>Giờ làm</th>
                                        <th style={{ textAlign: 'center' }}>Nguồn</th>
                                        <th>Ghi chú</th>
                                        {currentState !== 'LOCKED' && <th style={{ textAlign: 'center' }}>Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {employeeRecords.map(r => {
                                        const day = getDayName(r.date)
                                        const isWeekend = day === 'T7' || day === 'CN'
                                        const effectiveState = recordStates[r.id] || r.state
                                        const stateColor = stateColors[effectiveState] || '#8FA3BF'

                                        return (
                                            <tr key={r.id} style={{
                                                background: isWeekend ? '#F8F9FB' : 'transparent',
                                                opacity: !r.checkIn && !r.checkOut ? 0.6 : 1,
                                            }}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                </td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    color: isWeekend ? '#EF4444' : '#4A5E78',
                                                    fontWeight: isWeekend ? 600 : 400,
                                                }}>{day}</td>
                                                <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                                                    {formatTime(r.checkIn)}
                                                </td>
                                                <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                                                    {formatTime(r.checkOut)}
                                                </td>
                                                <td style={{
                                                    textAlign: 'center', fontWeight: 700,
                                                    color: r.workHours >= 8 ? '#22C55E' : r.workHours > 0 ? '#F59E0B' : '#CBD5E1',
                                                }}>
                                                    {r.workHours > 0 ? `${r.workHours}h` : '—'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600,
                                                        color: stateColor,
                                                        background: stateColor + '15',
                                                        padding: '2px 8px', borderRadius: 10,
                                                    }}>
                                                        {stateLabels[effectiveState] || effectiveState}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12, color: '#6B7280', maxWidth: 150 }}>
                                                    {r.note || ''}
                                                </td>
                                                {currentState !== 'LOCKED' && (
                                                    <td style={{ textAlign: 'center' }}>
                                                        {effectiveState === 'PENDING' && (
                                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    style={{ padding: '2px 8px', fontSize: 11, background: '#22C55E15', color: '#22C55E', border: 'none' }}
                                                                    onClick={() => handleReview(r.id, 'APPROVED')}
                                                                >✓</button>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    style={{ padding: '2px 8px', fontSize: 11, background: '#EF444415', color: '#EF4444', border: 'none' }}
                                                                    onClick={() => handleReview(r.id, 'REJECTED')}
                                                                >✕</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
