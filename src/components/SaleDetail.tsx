'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    updateOrder, deleteOrder, updateOrderState, saveOrderLines, saveMilestones,
    convertOrderToProject, sendQuotation, approveQuotation, rejectQuotation,
    convertToContract, signContract,
} from '@/lib/actions/sale'
import { useToast, ToastContainer } from '@/components/Toast'
import AttachmentPanel from '@/components/AttachmentPanel'

const allStateColors: Record<string, string> = {
    DRAFT: 'muted', SENT: 'info', APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning',
    NEGOTIATING: 'info', SIGNED: 'success', DONE: 'primary', CANCEL: 'danger',
}
const allStateLabels: Record<string, string> = {
    DRAFT: 'Nháp', SENT: 'Đã gửi CĐT', APPROVED: 'CĐT duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn',
    NEGOTIATING: 'Đang đàm phán', SIGNED: 'Đã ký HĐ', DONE: 'Hoàn thành', CANCEL: 'Huỷ', SALE: 'Đã ký',
}
const msStateLabels: Record<string, string> = { PAID: 'Đã thanh toán', INVOICED: 'Đã xuất HĐ', PENDING: 'Chưa đến hạn' }

type Line = { id?: string; description: string; qty: number; unitPrice: number }
type Milestone = { id?: string; name: string; percent: number; dueDate: string; state: string; amount?: number }

export default function SaleDetail({ order: initOrder, initialAttachments = [] }: { order: any; initialAttachments?: any[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [order, setOrder] = useState(initOrder)
    const [editingLines, setEditingLines] = useState(false)
    const [editingMS, setEditingMS] = useState(false)
    const [lines, setLines] = useState<Line[]>(initOrder.lines || [])
    const [milestones, setMilestones] = useState<Milestone[]>(initOrder.milestones || [])
    const [saving, setSaving] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectDialog, setShowRejectDialog] = useState(false)

    const isQuotation = order.docType === 'QUOTATION'
    const isContract = order.docType === 'CONTRACT'
    const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)

    // ── Quotation actions ──
    async function handleSend() {
        if (!confirm(`Gửi báo giá "${order.name}" cho CĐT?`)) return
        try {
            const updated = await sendQuotation(order.id)
            setOrder((prev: any) => ({ ...prev, ...updated }))
            addToast(`Đã gửi báo giá ${order.name} cho CĐT`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleApprove() {
        if (!confirm(`CĐT đã duyệt báo giá "${order.name}"?`)) return
        try {
            const updated = await approveQuotation(order.id)
            setOrder((prev: any) => ({ ...prev, ...updated }))
            addToast(`CĐT đã duyệt báo giá ${order.name}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleReject() {
        try {
            const updated = await rejectQuotation(order.id, rejectReason)
            setOrder((prev: any) => ({ ...prev, ...updated }))
            setShowRejectDialog(false)
            addToast(`Báo giá ${order.name} đã bị từ chối`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleConvertToContract() {
        if (!confirm(`Chuyển báo giá "${order.name}" thành Hợp đồng đàm phán?`)) return
        try {
            const contract = await convertToContract(order.id)
            addToast(`Đã tạo hợp đồng ${contract.name}`)
            router.push(`/sale/${contract.id}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    // ── Contract actions ──
    async function handleSign() {
        if (!confirm(`Ký hợp đồng "${order.name}"?`)) return
        try {
            const updated = await signContract(order.id)
            setOrder((prev: any) => ({ ...prev, ...updated }))
            addToast(`Đã ký hợp đồng ${order.name}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleDone() {
        try {
            const updated = await updateOrderState(order.id, 'DONE')
            setOrder((prev: any) => ({ ...prev, ...updated }))
            addToast(`Đã hoàn thành ${order.name}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    // ── Generic actions ──
    async function handleStateChange(nextState: string) {
        try {
            const updated = await updateOrderState(order.id, nextState)
            setOrder((prev: any) => ({ ...prev, ...updated }))
            addToast(`Đã cập nhật trạng thái`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleSaveLines() {
        setSaving(true)
        try {
            await saveOrderLines(order.id, lines)
            setOrder((prev: any) => ({ ...prev, totalAmount }))
            setEditingLines(false)
            addToast('Đã cập nhật dịch vụ')
        } catch (err: any) { addToast(err.message, 'error') }
        finally { setSaving(false) }
    }

    async function handleSaveMS() {
        setSaving(true)
        try {
            await saveMilestones(order.id, milestones)
            setEditingMS(false)
            addToast('Đã cập nhật milestones')
        } catch (err: any) { addToast(err.message, 'error') }
        finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!confirm(`Xóa "${order.name}"? Tất cả dịch vụ và milestones sẽ bị xóa.`)) return
        try { await deleteOrder(order.id); addToast('Đã xóa'); router.push('/sale') }
        catch (err: any) { addToast(err.message, 'error') }
    }

    async function handleConvertToProject() {
        if (!confirm(`Tạo dự án từ "${order.name}"?`)) return
        try {
            const proj = await convertOrderToProject(order.id)
            addToast(`Đã tạo dự án ${proj.code}`)
            router.push(`/projects/${proj.id}`)
        } catch (err: any) { addToast(err.message, 'error') }
    }

    const totalPaid = milestones.filter(m => m.state === 'PAID').reduce((s, m) => s + Number(m.amount || 0), 0)
    const paidPercent = Number(order.totalAmount) > 0 ? Math.round(totalPaid / Number(order.totalAmount) * 100) : 0

    // ── Flow buttons based on docType + state ──
    function renderFlowButtons() {
        if (isQuotation) {
            switch (order.state) {
                case 'DRAFT':
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#3B82F6', color: '#fff', border: 'none' }} onClick={handleSend}>📤 Gửi CĐT</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => handleStateChange('CANCEL')}>Huỷ</button>
                        </>
                    )
                case 'SENT':
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#22C55E', color: '#fff', border: 'none' }} onClick={handleApprove}>✅ CĐT duyệt</button>
                            <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }} onClick={() => setShowRejectDialog(true)}>❌ Từ chối</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleStateChange('DRAFT')}>↩ Về nháp</button>
                        </>
                    )
                case 'APPROVED':
                    return (
                        <button className="btn btn-sm" style={{ background: '#6366F1', color: '#fff', border: 'none' }} onClick={handleConvertToContract}>📝 Chuyển sang Hợp đồng</button>
                    )
                case 'REJECTED': case 'EXPIRED': case 'CANCEL':
                    return (
                        <button className="btn btn-ghost btn-sm" onClick={() => handleStateChange('DRAFT')}>↩ Mở lại</button>
                    )
                default: return null
            }
        }

        if (isContract) {
            switch (order.state) {
                case 'NEGOTIATING':
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#22C55E', color: '#fff', border: 'none' }} onClick={handleSign}>✅ Ký hợp đồng</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => handleStateChange('CANCEL')}>Huỷ</button>
                        </>
                    )
                case 'SIGNED':
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#6366F1', color: '#fff', border: 'none' }} onClick={handleDone}>🏁 Hoàn thành</button>
                            <button className="btn btn-accent btn-sm" onClick={handleConvertToProject}>🏗️ Tạo dự án</button>
                        </>
                    )
                case 'CANCEL':
                    return <button className="btn btn-ghost btn-sm" onClick={() => handleStateChange('NEGOTIATING')}>↩ Mở lại</button>
                default: return null
            }
        }

        return null
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Reject Dialog */}
            {showRejectDialog && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Lý do từ chối</h3>
                        <textarea className="form-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            rows={3} placeholder="Nhập lý do CĐT từ chối..." style={{ width: '100%', resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectDialog(false)}>Huỷ</button>
                            <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }} onClick={handleReject}>Từ chối</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/sale" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Báo giá & HĐ</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{order.name}</span>
            </div>

            {/* Header */}
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{order.name}</h1>
                        <span className={`badge badge-${allStateColors[order.state] || 'muted'}`}>{allStateLabels[order.state] || order.state}</span>
                        <span style={{ fontSize: 11, background: isQuotation ? '#EFF6FF' : '#F5F3FF', color: isQuotation ? '#3B82F6' : '#6366F1', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {isQuotation ? '📋 Báo giá' : '📝 Hợp đồng'}
                        </span>
                    </div>
                    <p className="page-subtitle">{order.partnerName} • Tổng: {formatCurrency(Number(order.totalAmount))}</p>
                </div>
                <div className="page-actions" style={{ flexWrap: 'wrap' }}>
                    {renderFlowButtons()}
                    <a href={`/api/pdf/${initOrder.id}`} target="_blank" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>📄 Xuất PDF</a>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={handleDelete}>Xóa</button>
                </div>
            </div>

            {/* Linked quotation info */}
            {isContract && order.quotation && (
                <div className="card" style={{ padding: 16, marginBottom: 20, background: '#FAFBFC', border: '1.5px dashed #CBD5E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span style={{ color: '#8FA3BF' }}>Từ báo giá:</span>
                        <Link href={`/sale/${order.quotation.id}`} style={{ fontWeight: 700, color: '#3B82F6' }}>{order.quotation.name}</Link>
                        <span style={{ color: '#8FA3BF' }}>— {order.quotation.partnerName} — {formatCurrency(Number(order.quotation.totalAmount))}</span>
                    </div>
                </div>
            )}

            {/* Payment Progress (only for contracts) */}
            {isContract && (
                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Tiến độ thanh toán</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>{formatCurrency(totalPaid)} / {formatCurrency(Number(order.totalAmount))}</div>
                    </div>
                    <div className="progress" style={{ height: 12, marginBottom: 8 }}>
                        <div className="progress-bar" style={{ width: `${paidPercent}%`, background: '#22C55E' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8FA3BF' }}>
                        <span>Đã thu: {paidPercent}%</span>
                        <span>Còn lại: {formatCurrency(Number(order.totalAmount) - totalPaid)}</span>
                    </div>
                </div>
            )}

            <div className="grid-2" style={{ alignItems: 'flex-start', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Info */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{isQuotation ? 'Thông tin báo giá' : 'Thông tin hợp đồng'}</div>
                        {[
                            { label: 'Khách hàng', value: order.partnerName },
                            { label: 'Email', value: order.partnerEmail ?? '—' },
                            { label: 'SĐT', value: order.partnerPhone ?? '—' },
                            { label: 'Ngày tạo', value: order.createdAt ? formatDate(String(order.createdAt).split('T')[0]) : '—' },
                            ...(isQuotation ? [
                                { label: 'Hiệu lực', value: order.validityDate ? formatDate(String(order.validityDate).split('T')[0]) : '—' },
                                ...(order.sentAt ? [{ label: 'Ngày gửi', value: formatDate(String(order.sentAt).split('T')[0]) }] : []),
                                ...(order.approvedAt ? [{ label: 'Ngày duyệt', value: formatDate(String(order.approvedAt).split('T')[0]) }] : []),
                            ] : [
                                ...(order.signedAt ? [{ label: 'Ngày ký', value: formatDate(String(order.signedAt).split('T')[0]) }] : []),
                            ]),
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13, marginBottom: 8 }}>
                                <span style={{ color: '#8FA3BF', width: 100, flexShrink: 0 }}>{label}</span>
                                <span style={{ color: '#0F1C2E' }}>{value}</span>
                            </div>
                        ))}
                        {order.rejectedReason && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
                                <strong>Lý do từ chối:</strong> {order.rejectedReason}
                            </div>
                        )}
                    </div>

                    {/* Lines */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>Chi tiết dịch vụ</div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { if (editingLines) handleSaveLines(); else setEditingLines(true) }}>
                                {saving ? '⏳' : editingLines ? '💾 Lưu' : '✏️ Sửa'}
                            </button>
                        </div>

                        {editingLines ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lines.map((line, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 30px', gap: 6 }}>
                                        <input className="form-input" value={line.description} placeholder="Mô tả..."
                                            onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, description: e.target.value } : l))} />
                                        <input className="form-input" type="number" value={line.qty} style={{ textAlign: 'center' }}
                                            onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, qty: +e.target.value || 1 } : l))} />
                                        <input className="form-input" type="number" value={line.unitPrice || ''} placeholder="0" style={{ textAlign: 'right' }}
                                            onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, unitPrice: +e.target.value || 0 } : l))} />
                                        <button onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8FA3BF' }}>✕</button>
                                    </div>
                                ))}
                                <button onClick={() => setLines(prev => [...prev, { description: '', qty: 1, unitPrice: 0 }])}
                                    className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1', width: 'fit-content' }}>+ Thêm dòng</button>
                                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#1F3A5F', marginTop: 8 }}>
                                    Tổng: {formatCurrency(totalAmount)}
                                </div>
                            </div>
                        ) : (
                            <table className="data-table" style={{ fontSize: 13 }}>
                                <thead><tr><th>Mô tả</th><th style={{ textAlign: 'center' }}>SL</th><th style={{ textAlign: 'right' }}>Đơn giá</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                                <tbody>
                                    {(order.lines || []).length === 0 ? (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có dịch vụ</td></tr>
                                    ) : (order.lines || []).map((l: any) => (
                                        <tr key={l.id}>
                                            <td style={{ fontWeight: 500 }}>{l.description}</td>
                                            <td style={{ textAlign: 'center', color: '#8FA3BF' }}>{l.qty}</td>
                                            <td style={{ textAlign: 'right', color: '#4A5E78' }}>{formatCurrency(Number(l.unitPrice || 0))}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(l.subtotal || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr style={{ background: '#F8F9FB' }}>
                                    <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right' }}>Tổng</td>
                                    <td style={{ fontWeight: 800, textAlign: 'right', color: '#1F3A5F' }}>{formatCurrency(Number(order.totalAmount))}</td>
                                </tr></tfoot>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Milestones (only for contracts) */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Milestones</div>
                        {isContract && (
                            <button className="btn btn-ghost btn-sm" onClick={() => { if (editingMS) handleSaveMS(); else setEditingMS(true) }}>
                                {saving ? '⏳' : editingMS ? '💾 Lưu' : '✏️ Sửa'}
                            </button>
                        )}
                    </div>

                    {editingMS ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {milestones.map((ms, i) => (
                                <div key={i} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <input className="form-input" value={ms.name} placeholder="Tên milestone"
                                            onChange={e => setMilestones(prev => prev.map((m, j) => j === i ? { ...m, name: e.target.value } : m))} style={{ flex: 1 }} />
                                        <button onClick={() => setMilestones(prev => prev.filter((_, j) => j !== i))}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>✕</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                                        <input className="form-input" type="number" value={ms.percent} placeholder="%"
                                            onChange={e => setMilestones(prev => prev.map((m, j) => j === i ? { ...m, percent: +e.target.value || 0 } : m))} />
                                        <input className="form-input" type="date" value={ms.dueDate || ''}
                                            onChange={e => setMilestones(prev => prev.map((m, j) => j === i ? { ...m, dueDate: e.target.value } : m))} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setMilestones(prev => [...prev, { name: `Milestone ${prev.length + 1}`, percent: 0, dueDate: '', state: 'PENDING' }])}
                                className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1' }}>+ Thêm milestone</button>
                            <div style={{ fontSize: 12, color: milestones.reduce((s, m) => s + m.percent, 0) === 100 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                                Tổng: {milestones.reduce((s, m) => s + m.percent, 0)}% {milestones.reduce((s, m) => s + m.percent, 0) !== 100 && '(cần = 100%)'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(order.milestones || []).length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                                    {isQuotation ? 'Milestones sẽ được cấu hình sau khi chuyển sang Hợp đồng' : 'Chưa có milestones'}
                                </div>
                            ) : (order.milestones || []).map((ms: any, i: number) => (
                                <div key={ms.id} style={{
                                    border: '1.5px solid', borderRadius: 10, padding: '14px 16px',
                                    borderColor: ms.state === 'PAID' ? '#22C55E40' : '#E2E8F0',
                                    background: ms.state === 'PAID' ? '#F0FDF4' : '#fff',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: ms.state === 'PAID' ? '#22C55E' : '#CBD5E1', color: '#fff', fontSize: 11, fontWeight: 800,
                                            }}>{ms.state === 'PAID' ? '✓' : i + 1}</div>
                                            <span style={{ fontWeight: 700, fontSize: 13 }}>{ms.name}</span>
                                        </div>
                                        <span className={`badge badge-${ms.state === 'PAID' ? 'success' : 'muted'}`}>{msStateLabels[ms.state] || ms.state}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: ms.state === 'PAID' ? '#22C55E' : '#1F3A5F' }}>
                                            {formatCurrency(Number(ms.amount || 0))} <span style={{ fontSize: 12, color: '#8FA3BF' }}>({ms.percent}%)</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>{ms.dueDate ? formatDate(String(ms.dueDate).split('T')[0]) : '—'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Attachments */}
            <div style={{ marginTop: 20 }}>
                <AttachmentPanel
                    entityType={isQuotation ? 'quotation' : 'contract'}
                    entityId={initOrder.id}
                    initialFiles={initialAttachments}
                />
            </div>
        </>
    )
}
