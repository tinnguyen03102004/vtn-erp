'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { generatePayrollSlips, confirmPayroll } from '@/lib/actions/payroll'

const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

interface Slip {
    id: string
    grossSalary: number
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
    slips: Slip[]
}

const stateLabels: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Nháp', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    PAID: { label: 'Đã chi', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    CANCELLED: { label: 'Đã hủy', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
}

export function PayrollDetail({ period }: { period: Period }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

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
                <div style={{ display: 'flex', gap: 8 }}>
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
                        <p style={{ fontSize: 14 }}>Bấm <strong>"⚡ Tạo phiếu lương"</strong> để hệ thống tự động tính lương cho tất cả nhân viên.</p>
                    )}
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Phòng ban</th>
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
                                <td colSpan={2} style={{ color: '#E2E8F0' }}>Tổng cộng ({slips.length} người)</td>
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
        </div>
    )
}
