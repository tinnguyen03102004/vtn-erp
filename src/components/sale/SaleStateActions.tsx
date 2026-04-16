'use client'

import { useState } from 'react'

interface SaleStateActionsProps {
    order: { id: string; name: string | null; state: string | null; docType: string }
    canEditSale: boolean
    canApproveSale: boolean
    canCreateProject: boolean
    onSend: () => Promise<void>
    onApprove: () => Promise<void>
    onReject: (reason: string) => Promise<void>
    onConvertToContract: () => Promise<void>
    onSign: () => Promise<void>
    onDone: () => Promise<void>
    onStateChange: (state: string) => Promise<void>
}

export default function SaleStateActions({
    order, canEditSale, canApproveSale, canCreateProject, onSend, onApprove, onReject, onConvertToContract, onSign, onDone, onStateChange,
}: SaleStateActionsProps) {
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const isQuotation = order.docType === 'QUOTATION'
    const isContract = order.docType === 'CONTRACT'

    function renderFlowButtons() {
        if (isQuotation) {
            switch (order.state) {
                case 'DRAFT':
                    if (!canEditSale) return null
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#3B82F6', color: '#fff', border: 'none' }} onClick={onSend}>{'📤'} Gửi CĐT</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => onStateChange('CANCEL')}>Huỷ</button>
                        </>
                    )
                case 'SENT':
                    if (!canEditSale && !canApproveSale) return null
                    return (
                        <>
                            {canApproveSale && <button className="btn btn-sm" style={{ background: '#22C55E', color: '#fff', border: 'none' }} onClick={onApprove}>{'✅'} CĐT duyệt</button>}
                            {canEditSale && <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }} onClick={() => setShowRejectDialog(true)}>{'❌'} Từ chối</button>}
                            {canEditSale && <button className="btn btn-ghost btn-sm" onClick={() => onStateChange('DRAFT')}>{'↩'} Về nháp</button>}
                        </>
                    )
                case 'APPROVED':
                    return canEditSale ? (
                        <button className="btn btn-sm" style={{ background: '#6366F1', color: '#fff', border: 'none' }} onClick={onConvertToContract}>{'📝'} Chuyển sang Hợp Đồng</button>
                    ) : null
                case 'REJECTED': case 'EXPIRED': case 'CANCEL':
                    return canEditSale ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => onStateChange('DRAFT')}>{'↩'} Mở lại</button>
                    ) : null
                default: return null
            }
        }

        if (isContract) {
            switch (order.state) {
                case 'NEGOTIATING':
                    if (!canEditSale) return null
                    return (
                        <>
                            <button className="btn btn-sm" style={{ background: '#22C55E', color: '#fff', border: 'none' }} onClick={onSign}>{'✅'} Ký hợp đồng</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => onStateChange('CANCEL')}>Huỷ</button>
                        </>
                    )
                case 'SIGNED':
                    if (!canEditSale && !canCreateProject) return null
                    return (
                        <>
                            {canEditSale && <button className="btn btn-sm" style={{ background: '#6366F1', color: '#fff', border: 'none' }} onClick={onDone}>{'🏁'} Hoàn thành</button>}
                            {canCreateProject && <button className="btn btn-accent btn-sm" onClick={onConvertToContract}>{'🗒️'} Tạo dự án</button>}
                        </>
                    )
                case 'CANCEL':
                    return canEditSale ? <button className="btn btn-ghost btn-sm" onClick={() => onStateChange('NEGOTIATING')}>{'↩'} Mở lại</button> : null
                default: return null
            }
        }

        return null
    }

    return (
        <>
            {renderFlowButtons()}

            {showRejectDialog && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Lý do từ chối</h3>
                        <textarea className="form-input" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            rows={3} placeholder="Nhập lý do CĐT từ chối..." style={{ width: '100%', resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowRejectDialog(false)}>Huỷ</button>
                            <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                                onClick={() => { onReject(rejectReason); setShowRejectDialog(false) }}>Từ chối</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
