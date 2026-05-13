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
    grossSalary: number
    fullGrossSalary?: number
    workDays?: number | null
    attendanceRatio?: number
    totalInsuranceEmployee: number
    pitAmount: number
    totalDeductions: number
    netSalary: number
    allowances: number
    bhxhEmployee: number
    bhytEmployee: number
    bhtnEmployee: number
    dependents: number
    employee: {
        department: string
        position: string
        user: { name: string; email: string }
    } | null
}

interface Period {
    id: string
    month: number
    year: number
    state: string
    totalGross: number
    totalDeductions: number
    totalNet: number
    slipCount: number
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

export function PayrollDetail({ period }: { period: Period }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showPayModal, setShowPayModal] = useState(false)
    const [bankRef, setBankRef] = useState('')

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

    return (
        <div className="page-container">
            {/* Breadcrumb */}
            <div style={{ marginBottom: 16, fontSize: 14 }}>
                <Link href="/payroll" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Bảng lương</Link>
                <span style={{ color: '#475569', margin: '0 8px' }}>/</span>
                <span style={{ color: '#E2E8F0' }}>{monthNames[period.month]} / {period.year}</span>
            </div>

            {/* Header */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 className="page-title" style={{ margin: 0 }}>
                            Kỳ lương {monthNames[period.month]} / {period.year}
                        </h1>
                        <span style={{ padding: '4px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, color: st.color, background: st.bg }}>
                            {st.label}
                        </span>
                    </div>
                    <p className="page-subtitle">{period.slipCount || 0} phiếu lương</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* PDF Export — always available when slips exist */}
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
                            {period.bankRef && <span style={{ color: '#8FA3BF' }}>• Ref: {period.bankRef}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>💰 Tổng Gross</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>{formatCurrency(Number(period.totalGross || 0))}</div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>📉 Tổng khấu trừ</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>{formatCurrency(Number(period.totalDeductions || 0))}</div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginBottom: 4 }}>✅ Tổng Net</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>{formatCurrency(Number(period.totalNet || 0))}</div>
                </div>
            </div>

            {/* Slips Table */}
            {slips.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#8FA3BF' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <p>Chưa có phiếu lương nào.</p>
                    {period.state === 'DRAFT' && (
                        <p style={{ fontSize: 14 }}>Bấm <strong>&quot;⚡ Tạo phiếu lương&quot;</strong> để hệ thống tự động tính lương cho tất cả nhân viên.</p>
                    )}
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Phòng ban</th>
                                <th style={{ textAlign: 'center' }}>Ngày công</th>
                                <th style={{ textAlign: 'right' }}>Gross</th>
                                <th style={{ textAlign: 'right' }}>BHXH</th>
                                <th style={{ textAlign: 'right' }}>BHYT</th>
                                <th style={{ textAlign: 'right' }}>BHTN</th>
                                <th style={{ textAlign: 'right' }}>Thuế TNCN</th>
                                <th style={{ textAlign: 'right' }}>Khấu trừ</th>
                                <th style={{ textAlign: 'right', fontWeight: 700 }}>Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slips.map((slip) => (
                                <tr key={slip.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#E2E8F0' }}>{slip.employee?.user?.name || '—'}</div>
                                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>{slip.employee?.position || ''}</div>
                                    </td>
                                    <td style={{ color: '#8FA3BF' }}>{slip.employee?.department || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {slip.workDays != null ? (
                                            <div>
                                                <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{slip.workDays}</span>
                                                <span style={{ fontSize: 11, color: '#8FA3BF' }}>/24</span>
                                                {slip.attendanceRatio != null && slip.attendanceRatio < 1 && (
                                                    <div style={{ fontSize: 10, color: '#F59E0B' }}>{Math.round(slip.attendanceRatio * 100)}%</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#475569', fontSize: 12 }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(slip.grossSalary)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slip.bhxhEmployee)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slip.bhytEmployee)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slip.bhtnEmployee)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#EF4444' }}>{formatCurrency(slip.pitAmount)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#EF4444' }}>{formatCurrency(slip.totalDeductions)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#10B981' }}>{formatCurrency(slip.netSalary)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid rgba(148, 163, 184, 0.2)', fontWeight: 700 }}>
                                <td colSpan={3} style={{ color: '#E2E8F0' }}>Tổng cộng ({slips.length} người)</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.grossSalary, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.bhxhEmployee, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.bhytEmployee, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#F59E0B' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.bhtnEmployee, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#EF4444' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.pitAmount, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#EF4444' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.totalDeductions, 0))}</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#10B981' }}>{formatCurrency(slips.reduce((s, sl) => s + sl.netSalary, 0))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setShowPayModal(false)}>
                    <div style={{ background: '#1E293B', borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(148,163,184,0.2)' }}
                        onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#E2E8F0', margin: '0 0 8px' }}>💳 Xác nhận chi trả</h2>
                        <p style={{ fontSize: 13, color: '#8FA3BF', margin: '0 0 20px' }}>
                            Tổng chi trả: <strong style={{ color: '#10B981' }}>{formatCurrency(Number(period.totalNet || 0))}</strong> cho {period.slipCount} nhân viên
                        </p>

                        {/* VietQR Code */}
                        <div style={{ textAlign: 'center', marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(148,163,184,0.1)' }}>
                            <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Quét QR để chuyển khoản</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={generateVietQrUrl({
                                    bankBin: BANK_BINS.MBBANK.bin,
                                    accountNumber: '0303506388',
                                    accountName: 'CTY TNHH VO TRONG NGHIA',
                                    amount: Number(period.totalNet || 0),
                                    memo: `Luong T${period.month}/${period.year} VTN`,
                                })}
                                alt="VietQR - Chuyển khoản lương"
                                style={{ width: 200, height: 200, borderRadius: 8, background: '#fff', padding: 4 }}
                            />
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
                                {BANK_BINS.MBBANK.shortName} • 0303506388 • CTY TNHH VÕ TRỌNG NGHĨA
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
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
