'use client'

import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

let toastId = 0

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }, [])

    return { toasts, addToast }
}

const toastColors: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534' },
    error: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
    info: { bg: '#EFF6FF', border: '#93C5FD', color: '#1E40AF' },
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
    if (toasts.length === 0) return null
    return (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map(t => {
                const c = toastColors[t.type]
                return (
                    <div key={t.id} style={{
                        padding: '12px 20px', borderRadius: 10, background: c.bg, border: `1.5px solid ${c.border}`,
                        color: c.color, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        animation: 'slideIn 0.3s ease',
                    }}>
                        {t.type === 'success' && '✅ '}{t.type === 'error' && '❌ '}{t.type === 'info' && 'ℹ️ '}
                        {t.message}
                    </div>
                )
            })}
        </div>
    )
}
