'use client'

import { useState, useTransition } from 'react'
import type { LeaveRequest, LeaveBalance, LeaveType, LeaveStatus } from '@/lib/actions/leave'
import { createLeaveRequest, approveLeaveRequest, rejectLeaveRequest } from '@/lib/actions/leave'

const STATUS_CONFIG: Record<LeaveStatus, { color: string; label: string; icon: string }> = {
    PENDING: { color: '#F59E0B', label: 'Chờ duyệt', icon: '⏳' },
    APPROVED: { color: '#10B981', label: 'Đã duyệt', icon: '✅' },
    REJECTED: { color: '#EF4444', label: 'Từ chối', icon: '❌' },
}

interface Props {
    requests: LeaveRequest[]
    balances: LeaveBalance[]
    leaveTypes: LeaveType[]
    isManager: boolean
    currentEmployeeId: string | null
    year: number
    overview?: Array<{
        employeeId: string
        name: string
        department: string
        balances: LeaveBalance[]
        pendingRequests: number
    }>
}

export default function LeaveManagement({ requests, balances, leaveTypes, isManager, year, overview }: Props) {
    const [tab, setTab] = useState<'my' | 'requests' | 'overview'>(isManager ? 'requests' : 'my')
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [formData, setFormData] = useState({
        leaveTypeId: leaveTypes[0]?.id || '',
        startDate: '',
        endDate: '',
        reason: '',
    })

    const pendingCount = requests.filter(r => r.status === 'PENDING').length
    const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0)
    const totalRemaining = balances.reduce((s, b) => s + b.remainingDays, 0)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.startDate || !formData.endDate || !formData.leaveTypeId) return

        startTransition(async () => {
            const result = await createLeaveRequest(formData)
            if (result.success) {
                setShowForm(false)
                setFormData({ leaveTypeId: leaveTypes[0]?.id || '', startDate: '', endDate: '', reason: '' })
                window.location.reload()
            } else {
                alert(result.error || 'Có lỗi xảy ra')
            }
        })
    }

    async function handleApprove(id: string) {
        if (!confirm('Xác nhận duyệt đơn nghỉ phép?')) return
        startTransition(async () => {
            const result = await approveLeaveRequest(id)
            if (result.success) window.location.reload()
            else alert(result.error || 'Có lỗi xảy ra')
        })
    }

    async function handleReject(id: string) {
        if (!confirm('Xác nhận từ chối đơn nghỉ phép?')) return
        startTransition(async () => {
            const result = await rejectLeaveRequest(id)
            if (result.success) window.location.reload()
            else alert(result.error || 'Có lỗi xảy ra')
        })
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏖️ Quản lý Nghỉ phép</h1>
                    <p className="page-subtitle">Năm {year} — Theo dõi phép năm và đơn nghỉ</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + Tạo đơn nghỉ
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {balances.map(b => (
                    <div key={b.id} className="card" style={{ padding: 16 }}>
                        <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8, fontWeight: 500 }}>{b.leaveTypeName}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <span style={{ fontSize: 24, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>{b.remainingDays}</span>
                                <span style={{ fontSize: 12, color: '#475569' }}> / {b.totalDays} ngày</span>
                            </div>
                            {b.usedDays > 0 && (
                                <span style={{ fontSize: 11, color: '#F59E0B' }}>Đã dùng: {b.usedDays}</span>
                            )}
                        </div>
                        <div className="progress" style={{ marginTop: 8, height: 4 }}>
                            <div className="progress-bar" style={{
                                width: `${b.totalDays > 0 ? (b.usedDays / b.totalDays * 100) : 0}%`,
                                background: b.usedDays / b.totalDays > 0.8 ? '#EF4444' : '#10B981',
                            }} />
                        </div>
                    </div>
                ))}
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8 }}>Tổng còn lại</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: totalRemaining > 5 ? '#10B981' : '#F59E0B', fontFamily: 'monospace' }}>{totalRemaining}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>ngày phép</div>
                </div>
                {isManager && (
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8 }}>Chờ duyệt</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: pendingCount > 0 ? '#F59E0B' : '#10B981', fontFamily: 'monospace' }}>{pendingCount}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>đơn nghỉ phép</div>
                    </div>
                )}
            </div>

            {/* Tab switcher */}
            {isManager && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(30,41,59,0.5)', borderRadius: 10, padding: 4 }}>
                    <button
                        onClick={() => setTab('my')}
                        className={`btn btn-sm ${tab === 'my' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, borderRadius: 8 }}
                    >
                        📋 Đơn của tôi
                    </button>
                    <button
                        onClick={() => setTab('requests')}
                        className={`btn btn-sm ${tab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, borderRadius: 8, position: 'relative' }}
                    >
                        📨 Đơn cần duyệt
                        {pendingCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -4, right: -4,
                                background: '#EF4444', color: '#fff', borderRadius: '50%',
                                width: 20, height: 20, fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('overview')}
                        className={`btn btn-sm ${tab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, borderRadius: 8 }}
                    >
                        👥 Tổng quan NV
                    </button>
                </div>
            )}

            {/* Create form modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowForm(false)}>
                    <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#E2E8F0', marginBottom: 20 }}>📝 Tạo đơn nghỉ phép</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label className="label">Loại nghỉ phép</label>
                                <select
                                    className="input"
                                    value={formData.leaveTypeId}
                                    onChange={e => setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))}
                                    style={{ width: '100%' }}
                                >
                                    {leaveTypes.map(lt => (
                                        <option key={lt.id} value={lt.id}>{lt.name} (tối đa {lt.maxDaysPerYear} ngày/năm)</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label className="label">Từ ngày</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.startDate}
                                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Đến ngày</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.endDate}
                                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label className="label">Lý do</label>
                                <textarea
                                    className="input"
                                    value={formData.reason}
                                    onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    rows={3}
                                    placeholder="Lý do nghỉ phép..."
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={isPending}>
                                    {isPending ? 'Đang gửi...' : 'Gửi đơn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content */}
            {(tab === 'my' || !isManager) && (
                <RequestsTable requests={requests} isManager={false} onApprove={handleApprove} onReject={handleReject} isPending={isPending} />
            )}
            {tab === 'requests' && isManager && (
                <RequestsTable requests={requests} isManager={true} onApprove={handleApprove} onReject={handleReject} isPending={isPending} />
            )}
            {tab === 'overview' && isManager && overview && (
                <OverviewTable overview={overview} />
            )}
        </div>
    )
}

function RequestsTable({ requests, isManager, onApprove, onReject, isPending }: {
    requests: LeaveRequest[]
    isManager: boolean
    onApprove: (id: string) => void
    onReject: (id: string) => void
    isPending: boolean
}) {
    const filtered = isManager
        ? requests.filter(r => r.status === 'PENDING')
        : requests

    if (filtered.length === 0) {
        return (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{isManager ? '📭' : '🏖️'}</div>
                <p>{isManager ? 'Không có đơn cần duyệt' : 'Chưa có đơn nghỉ phép nào'}</p>
            </div>
        )
    }

    return (
        <div className="card" style={{ overflowX: 'auto' }}>
            <div className="card-header" style={{ paddingBottom: 16 }}>
                <div className="card-title">{isManager ? 'Đơn cần duyệt' : 'Lịch sử nghỉ phép'}</div>
                <span className="badge badge-muted">{filtered.length} đơn</span>
            </div>
            <table className="data-table" style={{ width: '100%', minWidth: 700 }}>
                <thead>
                    <tr>
                        {isManager && <th>Nhân viên</th>}
                        <th>Loại</th>
                        <th>Từ ngày</th>
                        <th>Đến ngày</th>
                        <th style={{ textAlign: 'center' }}>Số ngày</th>
                        <th>Lý do</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                        {isManager && <th style={{ textAlign: 'right' }}>Thao tác</th>}
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(r => {
                        const cfg = STATUS_CONFIG[r.status]
                        return (
                            <tr key={r.id}>
                                {isManager && (
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{r.employeeName}</div>
                                    </td>
                                )}
                                <td>
                                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>
                                        {r.leaveTypeName}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                    {new Date(r.startDate).toLocaleDateString('vi-VN')}
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                    {new Date(r.endDate).toLocaleDateString('vi-VN')}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 700, color: '#E2E8F0' }}>
                                    {r.totalDays}
                                </td>
                                <td style={{ color: '#8FA3BF', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {r.reason || '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '3px 10px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: `${cfg.color}20`,
                                        color: cfg.color,
                                    }}>
                                        {cfg.icon} {cfg.label}
                                    </span>
                                </td>
                                {isManager && (
                                    <td style={{ textAlign: 'right' }}>
                                        {r.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => onApprove(r.id)}
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
                                                    onClick={() => onReject(r.id)}
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
    )
}

function OverviewTable({ overview }: {
    overview: Array<{
        employeeId: string
        name: string
        department: string
        balances: LeaveBalance[]
        pendingRequests: number
    }>
}) {
    return (
        <div className="card" style={{ overflowX: 'auto' }}>
            <div className="card-header" style={{ paddingBottom: 16 }}>
                <div className="card-title">Tổng quan nghỉ phép nhân viên</div>
                <span className="badge badge-muted">{overview.length} nhân viên</span>
            </div>
            <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
                <thead>
                    <tr>
                        <th>Nhân viên</th>
                        <th>Phòng ban</th>
                        <th style={{ textAlign: 'center' }}>Phép năm</th>
                        <th style={{ textAlign: 'center' }}>Nghỉ ốm</th>
                        <th style={{ textAlign: 'center' }}>KHL</th>
                        <th style={{ textAlign: 'center' }}>Tổng còn</th>
                        <th style={{ textAlign: 'center' }}>Đơn chờ</th>
                    </tr>
                </thead>
                <tbody>
                    {overview.map(emp => {
                        const annual = emp.balances.find(b => b.leaveTypeName.includes('Phép'))
                        const sick = emp.balances.find(b => b.leaveTypeName.includes('Ốm'))
                        const unpaid = emp.balances.find(b => b.leaveTypeName.includes('KHL') || b.leaveTypeName.includes('lương'))
                        const totalRemaining = emp.balances.reduce((s, b) => s + b.remainingDays, 0)

                        return (
                            <tr key={emp.employeeId}>
                                <td>
                                    <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{emp.name}</div>
                                </td>
                                <td style={{ color: '#8FA3BF', fontSize: 13 }}>{emp.department}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <BalanceCell balance={annual} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <BalanceCell balance={sick} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <BalanceCell balance={unpaid} />
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', color: totalRemaining > 5 ? '#10B981' : '#F59E0B' }}>
                                    {totalRemaining}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {emp.pendingRequests > 0 ? (
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                            background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                                        }}>
                                            {emp.pendingRequests} đơn
                                        </span>
                                    ) : (
                                        <span style={{ color: '#475569', fontSize: 12 }}>—</span>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function BalanceCell({ balance }: { balance?: LeaveBalance }) {
    if (!balance) return <span style={{ color: '#475569', fontSize: 12 }}>—</span>
    const pct = balance.totalDays > 0 ? balance.usedDays / balance.totalDays : 0
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: pct > 0.8 ? '#EF4444' : '#E2E8F0', fontSize: 13 }}>
                {balance.remainingDays}/{balance.totalDays}
            </span>
            <div className="progress" style={{ width: 40, height: 3 }}>
                <div className="progress-bar" style={{
                    width: `${pct * 100}%`,
                    background: pct > 0.8 ? '#EF4444' : pct > 0.5 ? '#F59E0B' : '#10B981',
                }} />
            </div>
        </div>
    )
}
