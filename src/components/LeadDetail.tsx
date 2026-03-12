'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateLead, deleteLead, convertLeadToOrder } from '@/lib/actions/crm'
import { useToast, ToastContainer } from '@/components/Toast'
import type { Tables } from '@/lib/supabase'

type Lead = Tables<'crm_leads'>

export default function LeadDetail({ lead: initialLead }: { lead: Lead }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [lead, setLead] = useState(initialLead)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(initialLead)

    async function handleSave() {
        if (!form.name || !form.partnerName) { addToast('TÃªn lead vÃ  khÃ¡ch hÃ ng báº¯t buá»c', 'error'); return }
        setSaving(true)
        const result = await updateLead(lead.id, {
            name: form.name,
            partnerName: form.partnerName,
            email: form.email || null,
            phone: form.phone || null,
            source: form.source || null,
            expectedValue: Number(form.expectedValue) || 0,
            notes: form.notes || null,
            updatedAt: new Date().toISOString(),
        })
        setSaving(false)
        if (!result.success) { addToast(result.error || 'Lá»-i', 'error'); return }
        setLead(result.data as Lead)
        setEditing(false)
        addToast('ÄÃ£ cáº­p nháº­t lead')
    }

    async function handleDelete() {
        if (!confirm(`XÃ³a lead "${lead.name}"? HÃ nh Äá»ng nÃ y khÃ´ng thá» hoÃ n tÃ¡c.`)) return
        try {
            await deleteLead(lead.id)
            addToast('ÄÃ£ xÃ³a lead')
            router.push('/crm')
        } catch (err: any) {
            addToast(err.message || 'Lá»-i khi xÃ³a', 'error')
        }
    }

    async function handleConvert() {
        if (!confirm(`Chuyá»n lead "${lead.name}" thÃ nh BÃ¡o giÃ¡?`)) return
        const result = await convertLeadToOrder(lead.id)
        if (!result.success) { addToast(result.error || 'Lá»-i', 'error'); return }
        addToast(`ÄÃ£ táº¡o bÃ¡o giÃ¡ ${result.data.name}`)
        router.push(`/sale/${result.data.id}`)
    }

    const fields = [
        { key: 'name', label: 'TÃªn lead', required: true },
        { key: 'partnerName', label: 'KhÃ¡ch hÃ ng', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Äiá»n thoáº¡i' },
        { key: 'source', label: 'Nguá»n' },
        { key: 'expectedValue', label: 'GiÃ¡ trá» Æ°á»c tÃ­nh', type: 'number' },
    ] as const

    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/crm" style={{ color: '#8FA3BF', textDecoration: 'none' }}>CRM & Leads</Link>
                <span>âº</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>{lead.name}</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h1 className="page-title" style={{ marginBottom: 0 }}>{lead.name}</h1>
                        <span className="badge badge-info">{lead.source ?? 'â'}</span>
                    </div>
                    <p className="page-subtitle">{lead.partnerName} â¢ {formatCurrency(Number(lead.expectedValue ?? 0))} â¢ {lead.probability}% xÃ¡c suáº¥t</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={handleDelete}>XÃ³a</button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setForm(lead); setEditing(!editing) }}>
                        {editing ? 'Huá»· sá»­a' : 'Sá»­a lead'}
                    </button>
                    <button className="btn btn-accent btn-sm" onClick={handleConvert}>
                        Chuyá»n sang BÃ¡o giÃ¡ â
                    </button>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                {/* Left: Info / Edit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                            {editing ? 'Chá»nh sá»­a thÃ´ng tin' : 'ThÃ´ng tin khÃ¡ch hÃ ng'}
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
                                    <label className="form-label">Ghi chÃº</label>
                                    <textarea
                                        className="form-textarea" rows={3}
                                        value={form.notes ?? ''}
                                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Huá»·</button>
                                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                                        {saving ? 'â³ Äang lÆ°u...' : 'ð¾ LÆ°u'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'TÃªn', value: lead.partnerName, bold: true },
                                    { label: 'Email', value: lead.email ?? 'â' },
                                    { label: 'Äiá»n thoáº¡i', value: lead.phone ?? 'â' },
                                    { label: 'Nguá»n', value: lead.source ?? 'â' },
                                    { label: 'NgÃ y táº¡o', value: lead.createdAt ? formatDate(String(lead.createdAt).split('T')[0]) : 'â' },
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
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>CÆ¡ há»i kinh doanh</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { label: 'GiÃ¡ trá» Æ°á»c tÃ­nh', value: formatCurrency(Number(lead.expectedValue ?? 0)), color: '#1F3A5F' },
                                { label: 'XÃ¡c suáº¥t', value: `${lead.probability ?? 0}%`, color: '#C9A84C' },
                                { label: 'GiÃ¡ trá» ká»³ vá»ng', value: formatCurrency(Number(lead.expectedValue ?? 0) * Number(lead.probability ?? 0) / 100), color: '#22C55E' },
                                { label: 'Nguá»n', value: lead.source ?? 'â', color: '#4A5E78' },
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
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Ghi chÃº</div>
                            <p style={{ fontSize: 13, color: '#4A5E78', lineHeight: 1.7 }}>{lead.notes}</p>
                        </div>
                    )}
                </div>

                {/* Right: Activity */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Lá»ch sá»­ hoáº¡t Äá»ng</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                        ChÆ°a cÃ³ hoáº¡t Äá»ng nÃ o ÄÆ°á»£c ghi nháº­n
                    </div>
                </div>
            </div>
        </>
    )
}
