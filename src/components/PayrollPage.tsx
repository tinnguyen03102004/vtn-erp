'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createPayrollPeriod, deletePayrollPeriod } from '@/lib/actions/payroll'

const stateLabels: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    PAID: { label: 'Đã chi', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    CANCELLED: { label: 'Đã hủy', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

export function PayrollPage({ periods }: { periods: Record<string, unknown>[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showForm, setShowForm] = useState(false)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [error, setError] = useState('')

    async function handleCreate() {
        setError('')
        const result = await createPayrollPeriod({ month, year })
        if (!result.success) {
            setError(result.error || 'Lỗi tạo kỳ lương')
            return
        }
        setShowForm(false)
        startTransition(() => router.refresh())
    }

    async function handleDelete(id: string) {
        if (!confirm('Xóa kỳ lương này?')) return
        const result = await deletePayrollPeriod(id)
        if (!result.success) {
            alert(result.error || 'Lỗi xóa')
            return
        }
        startTransition(() => router.refresh())
    }

    // KPI cards
    const totalNet = periods.reduce((s, p) => s + Number(p.totalNet || 0), 0)
    const confirmed = periods.filter((p) => p.state === 'CONFIRMED' || p.state === 'PAID').length
    const totalSlips = periods.reduce((s, p) => s + Number(p.slipCount || 0), 0)

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bảng lương</h1>
                    <p className="page-subtitle">{periods.length} kỳ lương</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + Tạo kỳ lương
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>💰 Tổng chi lương</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0' }}>{formatCurrency(totalNet)}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>✅ Đã xác nhận</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981' }}>{confirmed}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>📋 Tổng phiếu lương</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#3B82F6' }}>{totalSlips}</div>
                </div>
            </div>

            {/* Create Form Dialog */}
            {showForm && (
                <div className="card" style={{ padding: 24, marginBottom: 24, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <h3 style={{ margin: '0 0 16px', color: '#E2E8F0' }}>Tạo kỳ lương mới</h3>
                    {error && <div className="alert-error" style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, fontSize: 14 }}>{error}</div>}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>Tháng</label>
                            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ minWidth: 140 }}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{monthNames[i + 1]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>Năm</label>
                            <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ minWidth: 100 }}>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <option key={i} value={new Date().getFullYear() - 1 + i}>{new Date().getFullYear() - 1 + i}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={handleCreate}>Tạo</button>
                        <button className="btn btn-ghost" onClick={() => { setShowForm(false); setError('') }}>Hủy</button>
                    </div>
                </div>
            )}

            {/* Table */}
            {periods.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <p>Chưa có kỳ lương nào. Bấm "Tạo kỳ lương" để bắt đầu.</p>
                </div>
            ) : (
                <div className="card">
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Kỳ lương</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Số phiếu</th>
                                <th style={{ textAlign: 'right' }}>Tổng Gross</th>
                                <th style={{ textAlign: 'right' }}>Tổng Net</th>
                                <th style={{ textAlign: 'right' }}>Ngày tạo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((p) => {
                                const st = stateLabels[p.state as string] || stateLabels.DRAFT
                                return (
                                    <tr key={p.id as string}>
                                        <td>
                                            <Link href={`/payroll/${p.id}`} style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>
                                                {monthNames[p.month as number]} / {String(p.year)}
                                            </Link>
                                        </td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: st.color, background: st.bg }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{String(p.slipCount || 0)}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(Number(p.totalGross || 0))}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(Number(p.totalNet || 0))}</td>
                                        <td style={{ textAlign: 'right', color: '#8FA3BF' }}>{formatDate(p.createdAt as string)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {p.state === 'DRAFT' && (
                                                <button className="btn btn-ghost" onClick={() => handleDelete(p.id as string)} style={{ fontSize: 12, color: '#EF4444', padding: '4px 8px' }}>
                                                    Xóa
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
