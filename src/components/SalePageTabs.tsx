'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const quotationStateColors: Record<string, string> = {
    DRAFT: 'muted', SENT: 'info', APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning', CANCEL: 'danger',
}
const quotationStateLabels: Record<string, string> = {
    DRAFT: 'Nháp', SENT: 'Đã gửi CĐT', APPROVED: 'CĐT duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn', CANCEL: 'Huỷ',
}

const contractStateColors: Record<string, string> = {
    NEGOTIATING: 'info', SIGNED: 'success', DONE: 'primary', CANCEL: 'danger',
}
const contractStateLabels: Record<string, string> = {
    NEGOTIATING: 'Đang đàm phán', SIGNED: 'Đã ký HĐ', DONE: 'Hoàn thành', CANCEL: 'Huỷ',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SalePageTabs({ quotations, contracts }: { quotations: any[]; contracts: any[] }) {
    const [tab, setTab] = useState<'quotation' | 'contract'>('quotation')

    // Quotation KPIs
    const qDraft = quotations.filter(q => q.state === 'DRAFT').length
    const qSent = quotations.filter(q => q.state === 'SENT').length
    const qApproved = quotations.filter(q => q.state === 'APPROVED').length
    const qTotal = quotations.reduce((s, q) => s + Number(q.totalAmount || 0), 0)

    // Contract KPIs
    const cNegotiating = contracts.filter(c => c.state === 'NEGOTIATING').length
    const cSigned = contracts.filter(c => c.state === 'SIGNED').length
    const cDone = contracts.filter(c => c.state === 'DONE').length
    const cTotal = contracts.filter(c => ['SIGNED', 'DONE'].includes(c.state)).reduce((s, c) => s + Number(c.totalAmount || 0), 0)

    return (
        <>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Báo giá & Hợp đồng</h1>
                    <p className="page-subtitle">{quotations.length} báo giá — {contracts.length} hợp đồng</p>
                </div>
                <div className="page-actions">
                    <Link href="/sale/new" className="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Tạo báo giá
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
                <button
                    onClick={() => setTab('quotation')}
                    className="btn btn-sm"
                    style={{
                        background: tab === 'quotation' ? '#1F3A5F' : 'transparent',
                        color: tab === 'quotation' ? '#fff' : '#8FA3BF',
                        borderRadius: '8px 0 0 8px',
                        border: '1px solid #E2E8F0',
                        fontWeight: 600,
                        padding: '8px 20px',
                    }}
                >
                    📋 Báo giá ({quotations.length})
                </button>
                <button
                    onClick={() => setTab('contract')}
                    className="btn btn-sm"
                    style={{
                        background: tab === 'contract' ? '#1F3A5F' : 'transparent',
                        color: tab === 'contract' ? '#fff' : '#8FA3BF',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid #E2E8F0',
                        borderLeft: 'none',
                        fontWeight: 600,
                        padding: '8px 20px',
                    }}
                >
                    📝 Hợp đồng ({contracts.length})
                </button>
            </div>

            {/* ── Quotation Tab ── */}
            {tab === 'quotation' && (
                <>
                    <div className="grid-4" style={{ marginBottom: 24 }}>
                        {[
                            { label: 'Nháp', value: `${qDraft}`, icon: '📝' },
                            { label: 'Đã gửi CĐT', value: `${qSent}`, icon: '📤' },
                            { label: 'CĐT duyệt', value: `${qApproved}`, icon: '✅' },
                            { label: 'Tổng giá trị BG', value: formatCurrency(qTotal), icon: '💰' },
                        ].map(k => (
                            <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="kpi-label">{k.label}</div>
                                        <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{k.value}</div>
                                    </div>
                                    <div style={{ fontSize: 28 }}>{k.icon}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ paddingBottom: 16 }}>
                            <div className="card-title">Danh sách Báo giá</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Mã BG</th>
                                        <th>Khách hàng</th>
                                        <th>Trạng thái</th>
                                        <th>Giá trị</th>
                                        <th>Ngày tạo</th>
                                        <th>Hiệu lực</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotations.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#8FA3BF' }}>Chưa có báo giá nào</td></tr>
                                    )}
                                    {quotations.map(q => (
                                        <tr key={q.id}>
                                            <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F3A5F', fontSize: 13 }}>{q.name}</span></td>
                                            <td style={{ fontWeight: 600, fontSize: 13 }}>{q.partnerName}</td>
                                            <td><span className={`badge badge-${quotationStateColors[q.state] || 'muted'}`}>{quotationStateLabels[q.state] || q.state}</span></td>
                                            <td style={{ fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(q.totalAmount))}</td>
                                            <td style={{ color: '#8FA3BF', fontSize: 13 }}>{formatDate(String(q.createdAt).split('T')[0])}</td>
                                            <td style={{ color: '#8FA3BF', fontSize: 13 }}>{q.validityDate ? formatDate(String(q.validityDate).split('T')[0]) : '—'}</td>
                                            <td><Link href={`/sale/${q.id}`} className="btn btn-ghost btn-sm">Xem →</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── Contract Tab ── */}
            {tab === 'contract' && (
                <>
                    <div className="grid-4" style={{ marginBottom: 24 }}>
                        {[
                            { label: 'Đang đàm phán', value: `${cNegotiating}`, icon: '🤝' },
                            { label: 'Đã ký HĐ', value: `${cSigned}`, icon: '✅' },
                            { label: 'Hoàn thành', value: `${cDone}`, icon: '🏁' },
                            { label: 'Tổng giá trị HĐ', value: formatCurrency(cTotal), icon: '💰' },
                        ].map(k => (
                            <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="kpi-label">{k.label}</div>
                                        <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{k.value}</div>
                                    </div>
                                    <div style={{ fontSize: 28 }}>{k.icon}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ paddingBottom: 16 }}>
                            <div className="card-title">Danh sách Hợp đồng</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Mã HĐ</th>
                                        <th>Khách hàng</th>
                                        <th>Trạng thái</th>
                                        <th>Milestones</th>
                                        <th>Giá trị</th>
                                        <th>Ngày ký</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contracts.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#8FA3BF' }}>Chưa có hợp đồng nào</td></tr>
                                    )}
                                    {contracts.map(c => (
                                        <tr key={c.id}>
                                            <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F3A5F', fontSize: 13 }}>{c.name}</span></td>
                                            <td style={{ fontWeight: 600, fontSize: 13 }}>{c.partnerName}</td>
                                            <td><span className={`badge badge-${contractStateColors[c.state] || 'muted'}`}>{contractStateLabels[c.state] || c.state}</span></td>
                                            <td>
                                                <span style={{ background: '#F0F2F5', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                                                    {c._count?.milestones || 0} milestones
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(c.totalAmount))}</td>
                                            <td style={{ color: '#8FA3BF', fontSize: 13 }}>{c.signedAt ? formatDate(String(c.signedAt).split('T')[0]) : '—'}</td>
                                            <td><Link href={`/sale/${c.id}`} className="btn btn-ghost btn-sm">Xem →</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
