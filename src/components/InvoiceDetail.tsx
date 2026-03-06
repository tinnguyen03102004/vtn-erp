'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateInvoiceState, createPayment } from '@/lib/actions/finance'
import { generateInvoicePDF } from '@/lib/actions/invoice-pdf'
import { useToast, ToastContainer } from '@/components/Toast'

const stateColors: Record<string, string> = { DRAFT: 'muted', POSTED: 'info', PAID: 'success', CANCELLED: 'danger' }
const stateLabels: Record<string, string> = { DRAFT: 'Nháp', POSTED: 'Đã phát hành', PAID: 'Đã thanh toán', CANCELLED: 'Đã huỷ' }
const stateFlow: Record<string, { next: string; label: string }[]> = {
    DRAFT: [{ next: 'POSTED', label: '📤 Phát hành' }],
    POSTED: [{ next: 'PAID', label: '✅ Đã thanh toán' }, { next: 'CANCELLED', label: 'Huỷ' }],
    PAID: [], CANCELLED: [{ next: 'DRAFT', label: '↩ Mở lại' }],
}

export default function InvoiceDetail({ invoice: initInvoice }: { invoice: any }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [invoice, setInvoice] = useState(initInvoice)
    const [payments, setPayments] = useState(initInvoice.payments || [])
    const [showPayment, setShowPayment] = useState(false)

    const transitions = stateFlow[invoice.state] || []
    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    const remaining = Number(invoice.amountTotal) - totalPaid

    async function handleState(nextState: string) {
        try {
            const updated = await updateInvoiceState(invoice.id, nextState)
            setInvoice((prev: any) => ({ ...prev, ...updated }))
            addToast(`Đã chuyển → ${stateLabels[nextState]}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handlePayment(fd: FormData) {
        const amount = parseFloat(fd.get('amount') as string)
        const method = fd.get('method') as string
        const note = fd.get('note') as string
        if (!amount || amount <= 0) { addToast('Nhập số tiền hợp lệ', 'error'); return }
        try {
            const payment = await createPayment({
                invoiceId: invoice.id,
                amount,
                paymentDate: new Date().toISOString(),
                method: method || null,
                note: note || null,
            })
            setPayments((prev: any[]) => [payment, ...prev])
            setShowPayment(false)
            if (totalPaid + amount >= Number(invoice.amountTotal)) {
                setInvoice((prev: any) => ({ ...prev, state: 'PAID' }))
            }
            addToast(`Đã ghi nhận ${formatCurrency(amount)}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleExportPDF() {
        try {
            const { html } = await generateInvoicePDF(invoice.id)
            const win = window.open('', '_blank')
            if (win) { win.document.write(html); win.document.close(); win.print() }
        } catch (err: any) { addToast(err.message, 'error') }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/finance/invoices" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Hoá đơn</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{invoice.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{invoice.name}</h1>
                        <span className={`badge badge-${stateColors[invoice.state]}`}>{stateLabels[invoice.state]}</span>
                    </div>
                    <p className="page-subtitle">{invoice.partnerName} • {formatCurrency(Number(invoice.amountTotal))}</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        Xuất PDF
                    </button>
                    {transitions.map(t => (
                        <button key={t.next} className="btn btn-primary btn-sm" onClick={() => handleState(t.next)}>{t.label}</button>
                    ))}
                    {invoice.state === 'POSTED' && (
                        <button className="btn btn-accent btn-sm" onClick={() => setShowPayment(true)}>💰 Ghi nhận thanh toán</button>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'flex-start', gap: 20 }}>
                {/* Left: Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Chi tiết hoá đơn</div>
                        {[
                            { label: 'Khách hàng', value: invoice.partnerName },
                            { label: 'Email', value: invoice.partnerEmail ?? '—' },
                            { label: 'Dự án', value: invoice.project?.name ?? '—', link: invoice.projectId ? `/projects/${invoice.projectId}` : null },
                            { label: 'Ngày phát hành', value: invoice.invoiceDate ? formatDate(String(invoice.invoiceDate).split('T')[0]) : '—' },
                            { label: 'Hạn thanh toán', value: invoice.dueDate ? formatDate(String(invoice.dueDate).split('T')[0]) : '—' },
                        ].map(({ label, value, link }) => (
                            <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13, marginBottom: 8 }}>
                                <span style={{ color: '#8FA3BF', width: 120, flexShrink: 0 }}>{label}</span>
                                {link ? <Link href={link} style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>{value}</Link>
                                    : <span style={{ color: '#0F1C2E' }}>{value}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Số tiền</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'Trước thuế', value: formatCurrency(Number(invoice.amountUntaxed)), color: '#4A5E78' },
                                { label: 'Thuế', value: formatCurrency(Number(invoice.amountTax)), color: '#8FA3BF' },
                                { label: 'Tổng', value: formatCurrency(Number(invoice.amountTotal)), color: '#1F3A5F' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ background: '#F8F9FB', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                <span style={{ color: '#8FA3BF' }}>Đã thanh toán</span>
                                <span style={{ fontWeight: 700, color: '#22C55E' }}>{formatCurrency(totalPaid)}</span>
                            </div>
                            <div className="progress" style={{ height: 10, marginBottom: 6 }}>
                                <div className="progress-bar" style={{ width: `${Math.min(100, Number(invoice.amountTotal) > 0 ? totalPaid / Number(invoice.amountTotal) * 100 : 0)}%`, background: '#22C55E' }} />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 13, color: remaining > 0 ? '#EF4444' : '#22C55E', fontWeight: 700 }}>
                                Còn lại: {formatCurrency(Math.max(0, remaining))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Payments */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Lịch sử thanh toán</div>
                        {invoice.state === 'POSTED' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowPayment(true)}>+ Thanh toán</button>
                        )}
                    </div>

                    {showPayment && (
                        <form action={handlePayment} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div className="form-group">
                                    <label className="form-label">Số tiền *</label>
                                    <input className="form-input" name="amount" type="number" min="0" defaultValue={remaining > 0 ? remaining : ''} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phương thức</label>
                                    <select className="form-input" name="method">
                                        <option value="">— Chọn —</option>
                                        <option>Chuyển khoản</option>
                                        <option>Tiền mặt</option>
                                        <option>Ví điện tử</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ghi chú</label>
                                    <input className="form-input" name="note" placeholder="VD: CK ngày 15/3" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowPayment(false)}>Huỷ</button>
                                <button className="btn btn-primary btn-sm" type="submit">Ghi nhận</button>
                            </div>
                        </form>
                    )}

                    {payments.length === 0 && !showPayment ? (
                        <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>Chưa có thanh toán</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {payments.map((p: any) => (
                                <div key={p.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#22C55E' }}>{formatCurrency(Number(p.amount))}</div>
                                        <div style={{ fontSize: 11, color: '#8FA3BF' }}>{p.method ?? '—'} {p.note ? `• ${p.note}` : ''}</div>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8FA3BF' }}>{p.paymentDate ? formatDate(String(p.paymentDate).split('T')[0]) : '—'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
