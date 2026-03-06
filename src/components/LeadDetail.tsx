'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateLead, deleteLead, convertLeadToOrder } from '@/lib/actions/crm'
import { useToast, ToastContainer } from '@/components/Toast'

type Lead = {
    id: string; name: string; partnerName: string; email?: string; phone?: string
    source?: string; expectedValue?: any; probability?: number; notes?: string; createdAt?: string
}

export default function LeadDetail({ lead: initialLead }: { lead: Lead }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [lead, setLead] = useState(initialLead)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(initialLead)

    async function handleSave() {
        if (!form.name || !form.partnerName) { addToast('Tên lead và khách hàng bắt buộc', 'error'); return }
        setSaving(true)
        try {
            const updated = await updateLead(lead.id, {
                name: form.name,
                partnerName: form.partnerName,
                email: form.email || null,
                phone: form.phone || null,
                source: form.source || null,
                expectedValue: parseFloat(form.expectedValue) || 0,
                notes: form.notes || null,
                updatedAt: new Date().toISOString(),
            })
            setLead(updated)
            setEditing(false)
            addToast('Đã cập nhật lead')
        } catch (err: any) {
            addToast(err.message || 'Lỗi', 'error')
        } finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!confirm(`Xóa lead "${lead.name}"? Hành động này không thể hoàn tác.`)) return
        try {
            await deleteLead(lead.id)
            addToast('Đã xóa lead')
            router.push('/crm')
        } catch (err: any) {
            addToast(err.message || 'Lỗi khi xóa', 'error')
        }
    }

    async function handleConvert() {
        if (!confirm(`Chuyển lead "${lead.name}" thành Báo giá?`)) return
        try {
            const order = await convertLeadToOrder(lead.id)
            addToast(`Đã tạo báo giá ${order.name}`)
            router.push(`/sale/${order.id}`)
        } catch (err: any) {
            addToast(err.message || 'Lỗi', 'error')
        }
    }

    const fields = [
        { key: 'name', label: 'Tên lead', required: true },
        { key: 'partnerName', label: 'Khách hàng', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Điện thoại' },
        { key: 'source', label: 'Nguồn' },
        { key: 'expectedValue', label: 'Giá trị ước tính', type: 'number' },
    ] as const

    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/crm" style={{ color: '#8FA3BF', textDecoration: 'none' }}>CRM & Leads</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{lead.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{lead.name}</h1>
                        <span className="badge badge-info">{lead.source ?? '—'}</span>
                    </div>
                    <p className="page-subtitle">{lead.partnerName} • {formatCurrency(Number(lead.expectedValue ?? 0))} • {lead.probability}% xác suất</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={handleDelete}>Xóa</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setForm(lead); setEditing(!editing) }}>
                        {editing ? 'Huỷ sửa' : 'Sửa lead'}
                    </button>
                    <button className="btn btn-accent btn-sm" onClick={handleConvert}>
                        Chuyển sang Báo giá →
                    </button>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                {/* Left: Info / Edit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                            {editing ? 'Chỉnh sửa thông tin' : 'Thông tin khách hàng'}
                        </div>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {fields.map(f => (
                                    <div className="form-group" key={f.key}>
                                        <label className="form-label">{f.label} {(f as any).required && '*'}</label>
                                        <input
                                            className="form-input"
                                            type={(f as any).type || 'text'}
                                            value={(form as any)[f.key] ?? ''}
                                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label className="form-label">Ghi chú</label>
                                    <textarea
                                        className="form-textarea" rows={3}
                                        value={form.notes ?? ''}
                                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Huỷ</button>
                                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                                        {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Tên', value: lead.partnerName, bold: true },
                                    { label: 'Email', value: lead.email ?? '—' },
                                    { label: 'Điện thoại', value: lead.phone ?? '—' },
                                    { label: 'Nguồn', value: lead.source ?? '—' },
                                    { label: 'Ngày tạo', value: lead.createdAt ? formatDate(String(lead.createdAt).split('T')[0]) : '—' },
                                ].map(({ label, value, bold }) => (
                                    <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                                        <span style={{ color: '#8FA3BF', width: 100, flexShrink: 0 }}>{label}</span>
                                        <span style={{ fontWeight: bold ? 700 : 400, color: '#0F1C2E' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Cơ hội kinh doanh</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'Giá trị ước tính', value: formatCurrency(Number(lead.expectedValue ?? 0)), color: '#1F3A5F' },
                                { label: 'Xác suất', value: `${lead.probability ?? 0}%`, color: '#C9A84C' },
                                { label: 'Giá trị kỳ vọng', value: formatCurrency(Number(lead.expectedValue ?? 0) * Number(lead.probability ?? 0) / 100), color: '#22C55E' },
                                { label: 'Nguồn', value: lead.source ?? '—', color: '#4A5E78' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ background: '#F8F9FB', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {lead.notes && !editing && (
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Ghi chú</div>
                            <p style={{ fontSize: 13, color: '#4A5E78', lineHeight: 1.7 }}>{lead.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: Activity */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Lịch sử hoạt động</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                        Chưa có hoạt động nào được ghi nhận
                    </div>
                </div>
            </div>
        </>
    )
}
