'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addMissingAttendance } from '@/lib/actions/attendance'
import { useToast, ToastContainer } from '@/components/Toast'

interface AttendanceRecord {
    id: string
    date: string
    checkIn: string | null
    checkOut: string | null
    workHours: number
    source: string
    note: string | null
    state: string
}

interface PeriodOption {
    id: string
    name: string
    state: string
}

interface AttendanceData {
    period: { id: string; name: string; state: string; startDate: string; endDate: string }
    records: AttendanceRecord[]
    summary: { workDays: number; totalHours: number; avgHours: number; pendingCount: number }
}

export default function MyAttendanceView({
    data,
    periods,
    currentPeriodId,
}: {
    data: AttendanceData | null
    periods: PeriodOption[]
    currentPeriodId?: string
}) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [addingDate, setAddingDate] = useState<string | null>(null)
    const [form, setForm] = useState({ checkIn: '08:00', checkOut: '17:30', note: '' })
    const [submitting, setSubmitting] = useState(false)

    if (!data) {
        return (
            <>
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="page-title">Bảng chấm công của tôi</h1>
                    </div>
                </div>
                <div className="card" style={{ padding: 40, textAlign: 'center', color: '#8FA3BF' }}>
                    Chưa có dữ liệu chấm công. Vui lòng liên hệ HR.
                </div>
            </>
        )
    }

    const { period, records, summary } = data

    const getDayName = (dateStr: string) => {
        const d = new Date(dateStr)
        return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
    }

    const formatTime = (t: string | null) => t ? t.substring(0, 5) : '—'

    const isLocked = period.state === 'LOCKED'

    async function handleSubmitMissing() {
        if (!addingDate) return
        setSubmitting(true)
        try {
            const result = await addMissingAttendance(
                period.id, addingDate, form.checkIn, form.checkOut, form.note
            )
            if (!result.success) {
                addToast(result.error || 'Thất bại', 'error')
            } else {
                addToast('✅ Đã gửi bổ sung, chờ HR duyệt')
                setAddingDate(null)
                setForm({ checkIn: '08:00', checkOut: '17:30', note: '' })
                router.refresh()
            }
        } catch {
            addToast('Lỗi', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const stateLabel = (state: string) => {
        const map: Record<string, { label: string; color: string }> = {
            ORIGINAL: { label: '✓', color: '#22C55E' },
            PENDING: { label: '⏳ Chờ duyệt', color: '#F59E0B' },
            APPROVED: { label: '✅ Duyệt', color: '#3B82F6' },
            REJECTED: { label: '❌ Từ chối', color: '#EF4444' },
        }
        return map[state] || { label: state, color: '#8FA3BF' }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Bảng chấm công của tôi</h1>
                    <p className="page-subtitle">{period.name}</p>
                </div>
                <div className="page-actions">
                    <select
                        value={currentPeriodId || period.id}
                        onChange={e => router.push(`/attendance/me?periodId=${e.target.value}`)}
                        style={{
                            padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0',
                            fontSize: 13, color: '#1F3A5F', background: '#fff',
                        }}
                    >
                        {periods.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: '16px 24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>Ngày công</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1F3A5F' }}>{summary.workDays}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>Tổng giờ</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#22C55E' }}>{summary.totalHours}h</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>Giờ TB/ngày</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#3B82F6' }}>{summary.avgHours}h</div>
                    </div>
                    {summary.pendingCount > 0 && (
                        <div>
                            <div style={{ fontSize: 12, color: '#8FA3BF' }}>Chờ duyệt</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B' }}>{summary.pendingCount}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Records table */}
            <div className="card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: 13 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 90 }}>Ngày</th>
                                <th style={{ width: 40, textAlign: 'center' }}>Thứ</th>
                                <th style={{ textAlign: 'center' }}>Giờ vào</th>
                                <th style={{ textAlign: 'center' }}>Giờ ra</th>
                                <th style={{ textAlign: 'center' }}>Giờ làm</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th>Ghi chú</th>
                                {!isLocked && <th style={{ width: 100 }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => {
                                const day = getDayName(r.date)
                                const isWeekend = day === 'T7' || day === 'CN'
                                const isEmpty = !r.checkIn && !r.checkOut
                                const canAdd = isEmpty && !isLocked && r.state !== 'PENDING'
                                const sl = stateLabel(r.state)

                                return (
                                    <tr key={r.id} style={{
                                        background: isWeekend ? '#F8F9FB' : addingDate === r.date ? '#EFF6FF' : 'transparent',
                                        opacity: isEmpty && !canAdd ? 0.5 : 1,
                                    }}>
                                        <td style={{ fontWeight: 600 }}>
                                            {new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td style={{
                                            textAlign: 'center',
                                            color: isWeekend ? '#EF4444' : '#4A5E78',
                                            fontWeight: isWeekend ? 600 : 400,
                                        }}>{day}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{formatTime(r.checkIn)}</td>
                                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{formatTime(r.checkOut)}</td>
                                        <td style={{
                                            textAlign: 'center', fontWeight: 700,
                                            color: r.workHours >= 8 ? '#22C55E' : r.workHours > 0 ? '#F59E0B' : '#CBD5E1',
                                        }}>
                                            {r.workHours > 0 ? `${r.workHours}h` : '—'}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {r.source === 'EMPLOYEE_ADDED' && (
                                                <span style={{
                                                    fontSize: 11, color: sl.color, fontWeight: 600,
                                                }}>{sl.label}</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>{r.note || ''}</td>
                                        {!isLocked && (
                                            <td>
                                                {canAdd && !isWeekend && (
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ padding: '2px 8px', fontSize: 11 }}
                                                        onClick={() => setAddingDate(r.date)}
                                                    >+ Bổ sung</button>
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

            {/* Add missing attendance modal */}
            {addingDate && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 400, margin: 20 }}>
                        <div style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', marginBottom: 16 }}>
                                📝 Bổ sung chấm công
                            </h3>
                            <div style={{ marginBottom: 12, fontSize: 14, color: '#4A5E78' }}>
                                Ngày: <strong>{new Date(addingDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#8FA3BF', display: 'block', marginBottom: 4 }}>Giờ vào</label>
                                    <input
                                        type="time" value={form.checkIn}
                                        onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#8FA3BF', display: 'block', marginBottom: 4 }}>Giờ ra</label>
                                    <input
                                        type="time" value={form.checkOut}
                                        onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 14 }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 12, color: '#8FA3BF', display: 'block', marginBottom: 4 }}>Lý do bổ sung *</label>
                                <textarea
                                    value={form.note}
                                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                    placeholder="VD: Quên chấm vân tay, đi công trình..."
                                    style={{
                                        width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0',
                                        borderRadius: 6, fontSize: 13, minHeight: 60, resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button className="btn btn-sm" onClick={() => setAddingDate(null)}>Hủy</button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSubmitMissing}
                                    disabled={submitting || !form.note.trim()}
                                >
                                    {submitting ? '⏳...' : '📤 Gửi bổ sung'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
