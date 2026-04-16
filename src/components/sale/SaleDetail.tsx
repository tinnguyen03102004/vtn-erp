'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import {
    deleteOrder, updateOrderState, updateOrder as updateOrderAction,
    saveOrderLines, saveMilestones,
    convertOrderToProject, sendQuotation, approveQuotation, rejectQuotation,
    convertToContract, signContract, reviseQuotation,
    createInvoiceFromMilestone,
} from '@/lib/actions/sale'
import { useToast, ToastContainer } from '@/components/Toast'
import AttachmentPanel from '@/components/AttachmentPanel'
import SaleStateActions from './SaleStateActions'
import SaleOrderInfo from './SaleOrderInfo'
import SaleOrderLines from './SaleOrderLines'
import SaleMilestones from './SaleMilestones'
import type { OrderLineInput, MilestoneInput } from '@/lib/types'

const allStateColors: Record<string, string> = {
    DRAFT: 'muted', SENT: 'info', APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning',
    NEGOTIATING: 'info', SIGNED: 'success', DONE: 'primary', CANCEL: 'danger',
}
const allStateLabels: Record<string, string> = {
    DRAFT: 'Nháp', SENT: 'Đã gửi CĐT', APPROVED: 'CĐT duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn',
    NEGOTIATING: 'Đang đàm phán', SIGNED: 'Đã ký HĐ', DONE: 'Hoàn thành', CANCEL: 'Huỷ', SALE: 'Đã ký',
}

type Line = { id?: string; description: string; qty: number | null; unit?: string | null; unitPrice: number | null; discountPercent?: number | null; vatRate?: number | null; subtotal?: number | null }
type Milestone = { id?: string; name: string; percent: number | null; dueDate: string | null; state: string | null; amount?: number | null; invoiceId?: string | null }
type SaleAttachment = {
    id: string
    fileName: string
    fileType: string | null
    fileSize: number | null
    storagePath: string
    createdAt: string | null
}
type SaleQuotationLink = {
    id: string
    name: string | null
    partnerName: string | null
    totalAmount: number | string | null
}
type SaleDetailOrder = {
    id: string
    name: string | null
    state: string | null
    docType: string | null
    partnerName: string | null
    totalAmount: number | string | null
    discountPercent?: number | string | null
    discountAmount?: number | string | null
    vatRate?: number | string | null
    vatAmount?: number | string | null
    grandTotal?: number | string | null
    revision?: number | null
    lines?: Line[]
    milestones?: Milestone[]
    quotation?: SaleQuotationLink | null
    lead?: { id: string; name: string; partnerName: string | null } | null
    [key: string]: unknown
}

export default function SaleDetail({
    order: initOrder,
    initialAttachments = [],
    canEditSale,
    canApproveSale,
    canCreateProject,
}: {
    order: SaleDetailOrder
    initialAttachments?: SaleAttachment[]
    canEditSale: boolean
    canApproveSale: boolean
    canCreateProject: boolean
}) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [order, setOrder] = useState<SaleDetailOrder>(initOrder)
    const [editingLines, setEditingLines] = useState(false)
    const [editingMS, setEditingMS] = useState(false)
    const [editingFinance, setEditingFinance] = useState(false)
    const [lines, setLines] = useState<Line[]>(initOrder.lines || [])
    const [milestones, setMilestones] = useState<Milestone[]>(initOrder.milestones || [])
    const [saving, setSaving] = useState(false)
    const [discountPct, setDiscountPct] = useState(Number(initOrder.discountPercent || 0))
    const [vatRate, setVatRate] = useState(Number(initOrder.vatRate ?? 10))

    const isQuotation = order.docType === 'QUOTATION'
    const isContract = order.docType === 'CONTRACT'
    const totalAmount = lines.reduce((s, l) => s + (l.qty ?? 0) * (l.unitPrice ?? 0) * (1 - ((l.discountPercent ?? 0)) / 100), 0)
    const discountAmt = Math.round(totalAmount * discountPct / 100)
    const afterDiscount = totalAmount - discountAmt
    const vatAmt = Math.round(afterDiscount * vatRate / 100)
    const grandTotal = afterDiscount + vatAmt

    const totalPaid = milestones.filter(m => m.state === 'PAID').reduce((s, m) => s + Number(m.amount || 0), 0)
    const displayTotal = Number(order.grandTotal || order.totalAmount || 0)
    const paidPercent = displayTotal > 0 ? Math.round(totalPaid / displayTotal * 100) : 0

    const updateOrderUI = (data: Partial<SaleDetailOrder>) => setOrder(prev => ({ ...prev, ...data }))

    async function handleSend() {
        if (!confirm(`Gửi báo giá "${order.name}" cho CĐT?`)) return
        const result = await sendQuotation(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`Đã gửi báo giá ${order.name} cho CĐT`)
    }
    async function handleApprove() {
        if (!confirm(`CĐT đã duyệt báo giá "${order.name}"?`)) return
        const result = await approveQuotation(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`CĐT đã duyệt báo giá ${order.name}`)
    }
    async function handleReject(reason: string) {
        const result = await rejectQuotation(order.id, reason)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`Báo giá ${order.name} đã bị từ chối`)
    }
    async function handleConvertToContract() {
        if (!confirm(`Chuyển báo giá "${order.name}" thành Hợp đồng đàm phán?`)) return
        const result = await convertToContract(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        addToast(`Đã tạo hợp đồng ${result.data.name}`); router.push(`/sale/${result.data.id}`)
    }
    async function handleSign() {
        if (!confirm(`Ký hợp đồng "${order.name}"?`)) return
        const result = await signContract(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`Đã ký hợp đồng ${order.name}`)
    }
    async function handleDone() {
        const result = await updateOrderState(order.id, 'DONE')
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`Đã hoàn thành ${order.name}`)
    }
    async function handleStateChange(nextState: string) {
        const result = await updateOrderState(order.id, nextState)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrderUI(result.data); addToast(`Đã cập nhật trạng thái`)
    }
    async function handleSaveLines() {
        setSaving(true)
        const result = await saveOrderLines(order.id, lines.map((line) => ({
            orderId: order.id,
            ...line,
        })) satisfies OrderLineInput[])
        setSaving(false)
        if (!result.success) { addToast(result.error, 'error'); return }
        setEditingLines(false); addToast('Đã cập nhật dịch vụ')
        router.refresh()
    }
    async function handleSaveMS() {
        setSaving(true)
        const result = await saveMilestones(order.id, milestones.map((milestone) => ({
            orderId: order.id,
            ...milestone,
            dueDate: milestone.dueDate ?? undefined,
        })) satisfies MilestoneInput[])
        setSaving(false)
        if (!result.success) { addToast(result.error, 'error'); return }
        setEditingMS(false); addToast('Đã cập nhật milestones')
        router.refresh()
    }
    async function handleSaveFinance() {
        setSaving(true)
        const result = await updateOrderAction(order.id, { discountPercent: discountPct, vatRate })
        setSaving(false)
        if (!result.success) { addToast(result.error, 'error'); return }
        setEditingFinance(false); addToast('Đã cập nhật chiết khấu & thuế')
        router.refresh()
    }
    async function handleDelete() {
        if (!confirm(`Xóa "${order.name}"? Tất cả dịch vụ và milestones sẽ bị xóa.`)) return
        const result = await deleteOrder(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        addToast('Đã xóa'); router.push('/sale')
    }
    async function handleConvertToProject() {
        if (!confirm(`Tạo dự án từ "${order.name}"?`)) return
        const result = await convertOrderToProject(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        addToast(`Đã tạo dự án ${result.data.code}`); router.push(`/projects/${result.data.id}`)
    }
    async function handleRevise() {
        if (!confirm(`Tạo phiên bản báo giá mới từ "${order.name}"?`)) return
        const result = await reviseQuotation(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        addToast(`Đã tạo phiên bản mới: ${result.data.name}`); router.push(`/sale/${result.data.id}`)
    }
    async function handleCreateInvoice(milestoneId: string) {
        if (!confirm('Tạo hoá đơn từ mốc thanh toán này?')) return
        const result = await createInvoiceFromMilestone(milestoneId)
        if (!result.success) { addToast(result.error, 'error'); return }
        addToast(`Đã tạo hoá đơn ${result.data.name}`); router.refresh()
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/sale" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Báo giá &amp; HĐ</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{order.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{order.name}</h1>
                        <span className={`badge badge-${allStateColors[order.state ?? ''] || 'muted'}`}>{allStateLabels[order.state ?? ''] || order.state}</span>
                        <span style={{ fontSize: 11, background: isQuotation ? '#EFF6FF' : '#F5F3FF', color: isQuotation ? '#3B82F6' : '#6366F1', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {isQuotation ? '📋 Báo giá' : '📝 Hợp đồng'}
                        </span>
                        {order.revision && order.revision > 1 && (
                            <span style={{ fontSize: 11, background: '#FFF7ED', color: '#F97316', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                v{order.revision}
                            </span>
                        )}
                    </div>
                    <p className="page-subtitle">
                        {order.partnerName} • Tổng: {formatCurrency(displayTotal)}
                        {Number(order.vatAmount || 0) > 0 && <span style={{ color: '#8FA3BF', fontSize: 12 }}> (đã gồm VAT)</span>}
                    </p>
                </div>
                <div className="page-actions" style={{ flexWrap: 'wrap' }}>
                    <SaleStateActions order={{ ...order, docType: order.docType ?? '' }}
                        canEditSale={canEditSale}
                        canApproveSale={canApproveSale}
                        canCreateProject={canCreateProject}
                        onSend={handleSend} onApprove={handleApprove} onReject={handleReject}
                        onConvertToContract={isQuotation ? handleConvertToContract : handleConvertToProject}
                        onSign={handleSign} onDone={handleDone} onStateChange={handleStateChange} />
                    {isQuotation && canEditSale && ['REJECTED', 'EXPIRED'].includes(order.state ?? '') && (
                        <button className="btn btn-outline btn-sm" onClick={handleRevise}>🔄 Tạo phiên bản mới</button>
                    )}
                    <a href={`/api/pdf/${initOrder.id}`} target="_blank" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>📄 Xuất PDF</a>
                    {canEditSale && <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={handleDelete}>Xóa</button>}
                </div>
            </div>

            {/* Link to CRM lead */}
            {order.lead && (
                <div className="card" style={{ padding: 14, marginBottom: 16, background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span>🔗</span>
                        <span style={{ color: '#166534', fontWeight: 600 }}>Từ CRM:</span>
                        <Link href={`/crm`} style={{ fontWeight: 700, color: '#22C55E' }}>{order.lead.name}</Link>
                        <span style={{ color: '#8FA3BF' }}>— {order.lead.partnerName}</span>
                    </div>
                </div>
            )}

            {isContract && order.quotation && (
                <div className="card" style={{ padding: 16, marginBottom: 20, background: '#FAFBFC', border: '1.5px dashed #CBD5E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span style={{ color: '#8FA3BF' }}>Từ báo giá:</span>
                        <Link href={`/sale/${order.quotation.id}`} style={{ fontWeight: 700, color: '#3B82F6' }}>{order.quotation.name}</Link>
                        <span style={{ color: '#8FA3BF' }}>— {order.quotation.partnerName} — {formatCurrency(Number(order.quotation.totalAmount))}</span>
                    </div>
                </div>
            )}

            {isContract && (
                <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Tiến độ thanh toán</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#22C55E' }}>{formatCurrency(totalPaid)} / {formatCurrency(displayTotal)}</div>
                    </div>
                    <div className="progress" style={{ height: 12, marginBottom: 8 }}>
                        <div className="progress-bar" style={{ width: `${paidPercent}%`, background: '#22C55E' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8FA3BF' }}>
                        <span>Đã thu: {paidPercent}%</span>
                        <span>Còn lại: {formatCurrency(displayTotal - totalPaid)}</span>
                    </div>
                </div>
            )}

            <div className="grid-2" style={{ alignItems: 'flex-start', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SaleOrderInfo order={order} isQuotation={isQuotation} />
                    <SaleOrderLines order={order} lines={lines} setLines={setLines}
                        canEdit={canEditSale}
                        editing={editingLines} setEditing={setEditingLines}
                        saving={saving} onSave={handleSaveLines} totalAmount={totalAmount} />

                    {/* Finance Summary Card — VAT + Discount */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>💰 Tổng hợp tài chính</div>
                            {canEditSale && (
                                <button className="btn btn-ghost btn-sm" onClick={() => { if (editingFinance) handleSaveFinance(); else setEditingFinance(true) }}>
                                    {saving ? '⏳' : editingFinance ? '💾 Lưu' : '✏️ Sửa'}
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#8FA3BF' }}>Tổng dịch vụ (trước CK)</span>
                                <span style={{ fontWeight: 600 }}>{formatCurrency(totalAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                                <span style={{ color: '#8FA3BF' }}>Chiết khấu</span>
                                {editingFinance ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input className="form-input" type="number" value={discountPct || ''} min="0" max="100" step="0.5"
                                            style={{ width: 70, textAlign: 'right', padding: '4px 8px' }}
                                            onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)} />
                                        <span style={{ fontSize: 12 }}>%</span>
                                        <span style={{ color: '#EF4444', fontWeight: 600 }}>-{formatCurrency(discountAmt)}</span>
                                    </div>
                                ) : (
                                    <span style={{ color: '#EF4444', fontWeight: 600 }}>
                                        {discountPct > 0 ? `-${formatCurrency(Number(order.discountAmount || discountAmt))} (${discountPct}%)` : '—'}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                                <span style={{ color: '#8FA3BF' }}>Thuế GTGT</span>
                                {editingFinance ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input className="form-input" type="number" value={vatRate} min="0" max="100" step="1"
                                            style={{ width: 70, textAlign: 'right', padding: '4px 8px' }}
                                            onChange={e => setVatRate(parseFloat(e.target.value) || 0)} />
                                        <span style={{ fontSize: 12 }}>%</span>
                                        <span style={{ color: '#3B82F6', fontWeight: 600 }}>+{formatCurrency(vatAmt)}</span>
                                    </div>
                                ) : (
                                    <span style={{ fontWeight: 600 }}>
                                        +{formatCurrency(Number(order.vatAmount || vatAmt))} ({Number(order.vatRate ?? vatRate)}%)
                                    </span>
                                )}
                            </div>
                            <div style={{ borderTop: '2px solid #F0F2F5', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 800, fontSize: 15 }}>TỔNG CỘNG</span>
                                <span style={{ fontWeight: 800, fontSize: 18, color: '#1F3A5F' }}>
                                    {formatCurrency(Number(order.grandTotal || grandTotal))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <SaleMilestones order={order} milestones={milestones} setMilestones={setMilestones}
                        isContract={isContract} isQuotation={isQuotation}
                        canEdit={canEditSale}
                        editing={editingMS} setEditing={setEditingMS}
                        saving={saving} onSave={handleSaveMS} />

                    {/* Milestone → Invoice Actions */}
                    {isContract && milestones.some(m => m.state === 'PENDING') && canEditSale && (
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🧾 Xuất hoá đơn từ Milestone</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {milestones.filter(m => m.state === 'PENDING').map(ms => (
                                    <div key={ms.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8F9FB', borderRadius: 8 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{ms.name}</div>
                                            <div style={{ fontSize: 12, color: '#8FA3BF' }}>{formatCurrency(Number(ms.amount || 0))} ({ms.percent}%)</div>
                                        </div>
                                        <button className="btn btn-sm" style={{ background: '#6366F1', color: '#fff', border: 'none' }}
                                            onClick={() => handleCreateInvoice(ms.id!)}>
                                            📄 Tạo HĐ
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <AttachmentPanel
                    entityType="sale_order"
                    entityId={initOrder.id}
                    initialFiles={initialAttachments}
                    canManageFiles={canEditSale}
                />
            </div>
        </>
    )
}
