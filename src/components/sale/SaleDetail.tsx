'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import {
    deleteOrder, updateOrderState, saveOrderLines, saveMilestones,
    convertOrderToProject, sendQuotation, approveQuotation, rejectQuotation,
    convertToContract, signContract,
} from '@/lib/actions/sale'
import { useToast, ToastContainer } from '@/components/Toast'
import AttachmentPanel from '@/components/AttachmentPanel'
import SaleStateActions from './SaleStateActions'
import SaleOrderInfo from './SaleOrderInfo'
import SaleOrderLines from './SaleOrderLines'
import SaleMilestones from './SaleMilestones'

const allStateColors: Record<string, string> = {
    DRAFT: 'muted', SENT: 'info', APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning',
    NEGOTIATING: 'info', SIGNED: 'success', DONE: 'primary', CANCEL: 'danger',
}
const allStateLabels: Record<string, string> = {
    DRAFT: 'Nháp', SENT: 'Đã gửi CĐT', APPROVED: 'CĐT duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn',
    NEGOTIATING: 'Đang đàm phán', SIGNED: 'Đã ký HĐ', DONE: 'Hoàn thành', CANCEL: 'Huỷ', SALE: 'Đã ký',
}

type Line = { id?: string; description: string; qty: number; unitPrice: number }
type Milestone = { id?: string; name: string; percent: number; dueDate: string; state: string; amount?: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SaleDetail({ order: initOrder, initialAttachments = [] }: { order: any; initialAttachments?: any[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [order, setOrder] = useState(initOrder)
    const [editingLines, setEditingLines] = useState(false)
    const [editingMS, setEditingMS] = useState(false)
    const [lines, setLines] = useState<Line[]>(initOrder.lines || [])
    const [milestones, setMilestones] = useState<Milestone[]>(initOrder.milestones || [])
    const [saving, setSaving] = useState(false)

    const isQuotation = order.docType === 'QUOTATION'
    const isContract = order.docType === 'CONTRACT'
    const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    const totalPaid = milestones.filter(m => m.state === 'PAID').reduce((s, m) => s + Number(m.amount || 0), 0)
    const paidPercent = Number(order.totalAmount) > 0 ? Math.round(totalPaid / Number(order.totalAmount) * 100) : 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOrder = (data: any) => setOrder((prev: any) => ({ ...prev, ...data }))

    async function handleSend() {
        if (!confirm(`Gửi báo giá "${order.name}" cho CĐT?`)) return
        const result = await sendQuotation(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder(result.data); addToast(`Đã gửi báo giá ${order.name} cho CĐT`)
    }
    async function handleApprove() {
        if (!confirm(`CĐT đã duyệt báo giá "${order.name}"?`)) return
        const result = await approveQuotation(order.id)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder(result.data); addToast(`CĐT đã duyệt báo giá ${order.name}`)
    }
    async function handleReject(reason: string) {
        const result = await rejectQuotation(order.id, reason)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder(result.data); addToast(`Báo giá ${order.name} đã bị từ chối`)
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
        updateOrder(result.data); addToast(`Đã ký hợp đồng ${order.name}`)
    }
    async function handleDone() {
        const result = await updateOrderState(order.id, 'DONE')
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder(result.data); addToast(`Đã hoàn thành ${order.name}`)
    }
    async function handleStateChange(nextState: string) {
        const result = await updateOrderState(order.id, nextState)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder(result.data); addToast(`Đã cập nhật trạng thái`)
    }
    async function handleSaveLines() {
        setSaving(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await saveOrderLines(order.id, lines as any)
        setSaving(false)
        if (!result.success) { addToast(result.error, 'error'); return }
        updateOrder({ totalAmount }); setEditingLines(false); addToast('Đã cập nhật dịch vụ')
    }
    async function handleSaveMS() {
        setSaving(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await saveMilestones(order.id, milestones as any)
        setSaving(false)
        if (!result.success) { addToast(result.error, 'error'); return }
        setEditingMS(false); addToast('Đã cập nhật milestones')
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
                        <span className={`badge badge-${allStateColors[order.state] || 'muted'}`}>{allStateLabels[order.state] || order.state}</span>
                        <span style={{ fontSize: 11, background: isQuotation ? '#EFF6FF' : '#F5F3FF', color: isQuotation ? '#3B82F6' : '#6366F1', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {isQuotation ? '📋 Báo giá' : '📝 Hợp đồng'}
                        </span>
                    </div>
                    <p className="page-subtitle">{order.partnerName} • Tổng: {formatCurrency(Number(order.totalAmount))}</p>
                </div>
                <div className="page-actions" style={{ flexWrap: 'wrap' }}>
                    <SaleStateActions order={order}
                        onSend={handleSend} onApprove={handleApprove} onReject={handleReject}
                        onConvertToContract={isQuotation ? handleConvertToContract : handleConvertToProject}
                        onSign={handleSign} onDone={handleDone} onStateChange={handleStateChange} />
                    <a href={`/api/pdf/${initOrder.id}`} target="_blank" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>📄 Xuất PDF</a>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={handleDelete}>Xóa</button>
                </div>
            </div>

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
                    <SaleOrderInfo order={order} isQuotation={isQuotation} />
                    <SaleOrderLines order={order} lines={lines} setLines={setLines}
                        editing={editingLines} setEditing={setEditingLines}
                        saving={saving} onSave={handleSaveLines} totalAmount={totalAmount} />
                </div>
                <SaleMilestones order={order} milestones={milestones} setMilestones={setMilestones}
                    isContract={isContract} isQuotation={isQuotation}
                    editing={editingMS} setEditing={setEditingMS}
                    saving={saving} onSave={handleSaveMS} />
            </div>

            <div style={{ marginTop: 20 }}>
                <AttachmentPanel entityType={isQuotation ? 'quotation' : 'contract'} entityId={initOrder.id} initialFiles={initialAttachments} />
            </div>
        </>
    )
}
