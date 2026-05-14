'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { generatePayrollSlips, confirmPayroll, markPayrollPaid } from '@/lib/actions/payroll'
import { generateVietQrUrl, BANK_BINS } from '@vtn/vietnam'

const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

interface Slip {
    id: string
    grossSalary: number | string
    fullGrossSalary?: number | string | null
    workDays?: number | string | null
    attendanceRatio?: number | string | null
    totalInsuranceEmployee: number | string
    pitAmount: number | string
    totalDeductions: number | string
    netSalary: number | string
    allowances: number | string
    bhxhEmployee: number | string
    bhytEmployee: number | string
    bhtnEmployee: number | string
    dependents: number | string
    employee: {
        department: string
        position: string
        user: { name: string; email: string } | null
    } | null
}

interface Period {
    id: string
    month: number
    year: number
    state: string
    totalGross: number | string
    totalDeductions: number | string
    totalNet: number | string
    slipCount: number | string
    notes: string | null
    paidAt: string | null
    bankRef: string | null
    slips: Slip[]
}

const stateLabels: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    PAID: { label: 'Đã chi trả', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    CANCELLED: { label: 'Đã hủy', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

// Helper: safely convert DB value (string | number | null) to number
function num(val: unknown): number {
    if (val == null) return 0
    const n = typeof val === 'string' ? parseFloat(val) : Number(val)
    return isNaN(n) ? 0 : n
}

// Helper: format compact for mobile (shorter format)
function fmtCompact(val: unknown): string {
    const n = num(val)
    if (n === 0) return '0 ₫'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return formatCurrency(n)
}

export function PayrollDetail({ period }: { period: Period }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showPayModal, setShowPayModal] = useState(false)
    const [bankRef, setBankRef] = useState('')
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

    async function handleGenerate() {
        if (!confirm('Tạo phiếu lương cho tất cả nhân viên? (Phiếu cũ sẽ bị xóa)')) return
        const result = await generatePayrollSlips(period.id)
        if (!result.success) {
            alert(result.error || 'Lỗi tạo phiếu lương')
            return
        }
        alert(`Đã tạo ${result.data.count} phiếu lương thành công!`)
        startTransition(() => router.refresh())
    }

    async function handleConfirm() {
        if (!confirm('Xác nhận kỳ lương? Sau khi xác nhận sẽ không thể chỉnh sửa.')) return
        const result = await confirmPayroll(period.id)
        if (!result.success) {
            alert(result.error || 'Lỗi xác nhận')
            return
        }
        startTransition(() => router.refresh())
    }

    async function handlePay() {
        const result = await markPayrollPaid(period.id, bankRef || undefined)
        if (!result.success) {
            alert(result.error || 'Lỗi chi trả')
            return
        }
        setShowPayModal(false)
        setBankRef('')
        startTransition(() => router.refresh())
    }

    const st = stateLabels[period.state] || stateLabels.DRAFT
    const slips = period.slips || []

    // Computed totals using num() for safe conversion
    const totalGross = slips.reduce((s, sl) => s + num(sl.grossSalary), 0)
    const totalInsurance = slips.reduce((s, sl) => s + num(sl.bhxhEmployee) + num(sl.bhytEmployee) + num(sl.bhtnEmployee), 0)
    const totalPit = slips.reduce((s, sl) => s + num(sl.pitAmount), 0)
    const totalDeductions = slips.reduce((s, sl) => s + num(sl.totalDeductions), 0)
    const totalNet = slips.reduce((s, sl) => s + num(sl.netSalary), 0)

    return (
        <div className="page-container">
            {/* Breadcrumb */}
            <div style={{ marginBottom: 16, fontSize: 14 }}>
                <Link href="/payroll" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Bảng lương</Link>
                <span style={{ color: 'var(--color-text-muted)', margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{monthNames[period.month]} / {period.year}</span>
            </div>

            {/* Header */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>
                            Kỳ lương {monthNames[period.month]} / {period.year}
                        </h1>
                        <span style={{ padding: '4px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: st.color, background: st.bg }}>
                            {st.label}
                        </span>
                    </div>
                    <p className="page-subtitle">{num(period.slipCount)} phiếu lương</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* View mode toggle */}
                    {slips.length > 0 && (
                        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ borderRadius: 0, fontSize: 12 }}
                            >📊 Bảng</button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ borderRadius: 0, fontSize: 12 }}
                            >🃏 Thẻ</button>
                        </div>
                    )}

                    {/* PDF Export */}
                    {slips.length > 0 && (
                        <a
                            href={`/api/payroll/pdf/${period.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            📄 Xuất PDF
                        </a>
                    )}

                    {/* Draft actions */}
                    {period.state === 'DRAFT' && (
                        <>
                            <button className="btn btn-primary" onClick={handleGenerate} disabled={isPending}>
                                {isPending ? '...' : '⚡ Tạo phiếu lương'}
                            </button>
                            {slips.length > 0 && (
                                <button className="btn" onClick={handleConfirm} disabled={isPending} style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                    ✅ Xác nhận
                                </button>
                            )}
                        </>
                    )}

                    {/* Confirmed → Pay */}
                    {period.state === 'CONFIRMED' && (
                        <button
                            className="btn"
                            onClick={() => setShowPayModal(true)}
                            disabled={isPending}
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)' }}
                        >
                            💳 Chi trả lương
                        </button>
                    )}

                    {/* Paid info */}
                    {period.state === 'PAID' && period.paidAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3B82F6' }}>
                            <span>💳 Đã chi trả {new Date(period.paidAt).toLocaleDateString('vi-VN')}</span>
                            {period.bankRef && <span style={{ color: 'var(--color-text-muted)' }}>• Ref: {period.bankRef}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                <SummaryCard icon="💰" label="Tổng Gross" value={formatCurrency(num(period.totalGross))} />
                <SummaryCard icon="🛡️" label="Tổng BH" value={formatCurrency(totalInsurance)} color="#F59E0B" />
                <SummaryCard icon="📉" label="Tổng thuế" value={formatCurrency(totalPit)} color="#EF4444" />
                <SummaryCard icon="➖" label="Tổng khấu trừ" value={formatCurrency(num(period.totalDeductions))} color="#EF4444" />
                <SummaryCard icon="✅" label="Thực chi" value={formatCurrency(num(period.totalNet))} color="#10B981" />
            </div>

            {/* Slips */}
            {slips.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <p>Chưa có phiếu lương nào.</p>
                    {period.state === 'DRAFT' && (
                        <p style={{ fontSize: 14 }}>Bấm <strong>&quot;⚡ Tạo phiếu lương&quot;</strong> để hệ thống tự động tính lương cho tất cả nhân viên.</p>
                    )}
                </div>
            ) : viewMode === 'table' ? (
                <SlipsTable slips={slips} totalGross={totalGross} totalInsurance={totalInsurance} totalPit={totalPit} totalDeductions={totalDeductions} totalNet={totalNet} />
            ) : (
                <SlipsCards slips={slips} />
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowPayModal(false)}>
                    <div style={{ background: 'var(--color-bg)', borderRadius: 14, padding: 28, width: 480, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--color-border)' }}
                        onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>💳 Xác nhận chi trả</h2>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
                            Tổng chi trả: <strong style={{ color: '#10B981' }}>{formatCurrency(num(period.totalNet))}</strong> cho {num(period.slipCount)} nhân viên
                        </p>

                        {/* VietQR Code */}
                        <div style={{ textAlign: 'center', marginBottom: 20, padding: 16, background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Quét QR để chuyển khoản</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={generateVietQrUrl({
                                    bankBin: BANK_BINS.MBBANK.bin,
                                    accountNumber: '0303506388',
                                    accountName: 'CTY TNHH VO TRONG NGHIA',
                                    amount: num(period.totalNet),
                                    memo: `Luong T${period.month}/${period.year} VTN`,
                                })}
                                alt="VietQR - Chuyển khoản lương"
                                style={{ width: 200, height: 200, borderRadius: 8, background: '#fff', padding: 4 }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                                {BANK_BINS.MBBANK.shortName} • 0303506388 • CTY TNHH VÕ TRỌNG NGHĨA
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                                Mã tham chiếu ngân hàng (tuỳ chọn)
                            </label>
                            <input
                                type="text"
                                value={bankRef}
                                onChange={e => setBankRef(e.target.value)}
                                placeholder="VD: VCB-2026041600001"
                                className="form-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowPayModal(false)}>Huỷ</button>
                            <button
                                className="btn"
                                onClick={handlePay}
                                disabled={isPending}
                                style={{ background: '#3B82F6', color: '#fff', border: 'none' }}
                            >
                                {isPending ? '⏳' : '✅ Xác nhận đã chi trả'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Sub-components ──

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{icon}</span> {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: color || 'var(--color-text-primary)', fontFamily: 'monospace' }}>{value}</div>
        </div>
    )
}

function SlipsTable({ slips, totalGross, totalInsurance, totalPit, totalDeductions, totalNet }: {
    slips: Slip[]; totalGross: number; totalInsurance: number; totalPit: number; totalDeductions: number; totalNet: number
}) {
    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="data-table" style={{ width: '100%', minWidth: 1000 }}>
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--color-surface)', minWidth: 160 }}>Nhân viên</th>
                            <th>Phòng ban</th>
                            <th style={{ textAlign: 'center' }}>Ngày công</th>
                            <th style={{ textAlign: 'right' }}>Gross</th>
                            <th style={{ textAlign: 'right' }}>BHXH+YT+TN</th>
                            <th style={{ textAlign: 'right' }}>Thuế TNCN</th>
                            <th style={{ textAlign: 'right' }}>Khấu trừ</th>
                            <th style={{ textAlign: 'right', fontWeight: 700 }}>Thực nhận</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slips.map((slip) => {
                            const workDays = num(slip.workDays)
                            const ratio = num(slip.attendanceRatio)
                            const hasAttendance = slip.workDays != null && workDays > 0

                            return (
                                <tr key={slip.id}>
                                    <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--color-bg)' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{slip.employee?.user?.name || '—'}</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{slip.employee?.position || ''}</div>
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{slip.employee?.department || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {hasAttendance ? (
                                            <div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{workDays}</span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}> ngày</span>
                                                {ratio < 1 && (
                                                    <div style={{ fontSize: 10, color: '#F59E0B' }}>{Math.round(ratio * 100)}%</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Đủ công</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{formatCurrency(num(slip.grossSalary))}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#F59E0B' }}>
                                        {formatCurrency(num(slip.bhxhEmployee) + num(slip.bhytEmployee) + num(slip.bhtnEmployee))}
                                    </td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#EF4444' }}>{formatCurrency(num(slip.pitAmount))}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#EF4444' }}>{formatCurrency(num(slip.totalDeductions))}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#10B981' }}>{formatCurrency(num(slip.netSalary))}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                            <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>
                                Tổng ({slips.length} người)
                            </td>
                            <td></td>
                            <td></td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>{formatCurrency(totalGross)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#F59E0B' }}>{formatCurrency(totalInsurance)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#EF4444' }}>{formatCurrency(totalPit)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#EF4444' }}>{formatCurrency(totalDeductions)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#10B981' }}>{formatCurrency(totalNet)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}

function SlipsCards({ slips }: { slips: Slip[] }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {slips.map(slip => {
                const workDays = num(slip.workDays)
                const ratio = num(slip.attendanceRatio)
                const hasAttendance = slip.workDays != null && workDays > 0
                const insurance = num(slip.bhxhEmployee) + num(slip.bhytEmployee) + num(slip.bhtnEmployee)

                return (
                    <div key={slip.id} className="card" style={{ padding: 16 }}>
                        {/* Employee header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{slip.employee?.user?.name || '—'}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{slip.employee?.department || '—'} • {slip.employee?.position || ''}</div>
                            </div>
                            {hasAttendance && (
                                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: ratio >= 1 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: ratio >= 1 ? '#10B981' : '#F59E0B' }}>
                                    {workDays} ngày • {Math.round(ratio * 100)}%
                                </span>
                            )}
                        </div>

                        {/* Salary breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                            <Row label="Gross" value={fmtCompact(slip.grossSalary)} />
                            <Row label="Bảo hiểm" value={`-${fmtCompact(insurance)}`} color="#F59E0B" />
                            <Row label="Thuế TNCN" value={`-${fmtCompact(slip.pitAmount)}`} color="#EF4444" />
                            <Row label="Tổng trừ" value={`-${fmtCompact(slip.totalDeductions)}`} color="#EF4444" />
                        </div>

                        {/* Net */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>THỰC NHẬN</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>{formatCurrency(num(slip.netSalary))}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: color || 'var(--color-text-primary)' }}>{value}</span>
        </div>
    )
}
