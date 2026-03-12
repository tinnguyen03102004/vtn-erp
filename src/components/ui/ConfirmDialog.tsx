'use client'

import { useState } from 'react'

interface ConfirmDialogProps {
    open: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void | Promise<void>
    onCancel: () => void
}

const VARIANT_COLORS = {
    danger: { bg: '#EF4444', hover: '#DC2626' },
    warning: { bg: '#F59E0B', hover: '#D97706' },
    default: { bg: '#3B82F6', hover: '#2563EB' },
}

export default function ConfirmDialog({
    open, title = 'Xác nhận', message, confirmText = 'Xác nhận', cancelText = 'Huỷ',
    variant = 'default', onConfirm, onCancel,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false)
    const colors = VARIANT_COLORS[variant]

    if (!open) return null

    const handleConfirm = async () => {
        setLoading(true)
        try { await onConfirm() }
        finally { setLoading(false) }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={onCancel}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' }}
                onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: '#4A5E78', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={loading}>{cancelText}</button>
                    <button className="btn btn-sm" disabled={loading}
                        style={{ background: colors.bg, color: '#fff', border: 'none', opacity: loading ? 0.7 : 1 }}
                        onClick={handleConfirm}>
                        {loading ? '⏳' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
