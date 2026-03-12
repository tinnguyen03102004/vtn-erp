'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { createLead, moveLeadStage } from '@/lib/actions/crm'
import { useToast, ToastContainer } from '@/components/Toast'
import type { Tables } from '@/lib/supabase'

type Lead = Tables<'crm_leads'>
type Stage = { id: string; name: string; sequence: number; probability: number; leads: Lead[] }

const stageColors: Record<string, string> = {
    'Leads má»i': '#8FA3BF', 'LiÃªn há»': '#3B82F6', 'Äá» xuáº¥t': '#F59E0B',
    'ÄÃ m phÃ¡n': '#C9A84C', 'Tháº¯ng': '#22C55E',
}

export default function CRMKanban({ initialStages }: { initialStages: Stage[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [stages, setStages] = useState(initialStages)
    const [showModal, setShowModal] = useState(false)
    const [modalStageId, setModalStageId] = useState<string | null>(null)
    const dragRef = useRef<{ leadId: string; fromStageId: string } | null>(null)

    // ââ Drag & Drop ââ
    function onDragStart(e: React.DragEvent, leadId: string, fromStageId: string) {
        dragRef.current = { leadId, fromStageId }
        e.dataTransfer.effectAllowed = 'move'
            ; (e.target as HTMLElement).style.opacity = '0.5'
    }
    function onDragEnd(e: React.DragEvent) {
        ; (e.target as HTMLElement).style.opacity = '1'
    }
    function onDragOver(e: React.DragEvent) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }
    async function onDrop(e: React.DragEvent, toStageId: string) {
        e.preventDefault()
        if (!dragRef.current) return
        const { leadId, fromStageId } = dragRef.current
        if (fromStageId === toStageId) return

        // Optimistic UI
        setStages(prev => prev.map(s => {
            if (s.id === fromStageId) return { ...s, leads: s.leads.filter(l => l.id !== leadId) }
            if (s.id === toStageId) {
                const lead = prev.find(st => st.id === fromStageId)?.leads.find(l => l.id === leadId)
                if (lead) return { ...s, leads: [...s.leads, { ...lead, stageId: toStageId }] }
            }
            return s
        }))

        const toStage = stages.find(s => s.id === toStageId)
        try {
            await moveLeadStage(leadId, toStageId)
            addToast(`ÄÃ£ chuyá»n sang ${toStage?.name ?? 'stage má»i'}`)
        } catch {
            addToast('Lá»-i khi chuyá»n stage', 'error')
            router.refresh()
        }
        dragRef.current = null
    }

    // ââ Create Lead Modal ââ
    function openCreate(stageId?: string) {
        setModalStageId(stageId ?? stages[0]?.id ?? null)
        setShowModal(true)
    }

    async function handleCreate(formData: FormData) {
        const data = {
            name: formData.get('name') as string,
            partnerName: formData.get('partnerName') as string,
            email: formData.get('email') as string || null,
            phone: formData.get('phone') as string || null,
            source: formData.get('source') as string || null,
            expectedValue: parseFloat(formData.get('expectedValue') as string) || 0,
            notes: formData.get('notes') as string || null,
            stageId: modalStageId!,
            probability: stages.find(s => s.id === modalStageId)?.probability ?? 0,
        }

        if (!data.name || !data.partnerName) { addToast('Vui lÃ²ng nháº­p tÃªn lead vÃ  khÃ¡ch hÃ ng', 'error'); return }

        const result = await createLead(data)
        if (!result.success) { addToast(result.error || 'Lá»-i khi táº¡o lead', 'error'); return }
        setStages(prev => prev.map(s =>
            s.id === modalStageId ? { ...s, leads: [...s.leads, result.data as Lead] } : s
        ))
        setShowModal(false)
        addToast(`ÄÃ£ táº¡o lead "${data.name}"`)

    }

    const allLeads = stages.flatMap(s => s.leads)
    const totalPipelineValue = allLeads.reduce((s, l) => s + Number(l.expectedValue ?? 0), 0)

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">CRM & Leads</h1>
                    <p className="page-subtitle">{allLeads.length} leads â Pipeline: {formatCurrency(totalPipelineValue)}</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => openCreate()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        ThÃªm Lead
                    </button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tá»ng leads', value: `${allLeads.length}`, icon: 'ð¤' },
                    { label: 'Pipeline value', value: formatCurrency(totalPipelineValue), icon: 'ð°' },
                    { label: 'ÄÃ m phÃ¡n', value: `${stages.find(s => s.name === 'ÄÃ m phÃ¡n')?.leads.length ?? 0}`, icon: 'ð¤' },
                    { label: 'ÄÃ£ tháº¯ng', value: `${stages.find(s => s.name === 'Tháº¯ng')?.leads.length ?? 0}`, icon: 'ð' },
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

            {/* Kanban Board */}
            <div className="kanban-board">
                {stages.map(stage => {
                    const color = stageColors[stage.name] ?? '#8FA3BF'
                    return (
                        <div
                            key={stage.id}
                            className="kanban-column"
                            onDragOver={onDragOver}
                            onDrop={e => onDrop(e, stage.id)}
                        >
                            <div className="kanban-column-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                    {stage.name}
                                </div>
                                <span className="kanban-column-count">{stage.leads.length}</span>
                            </div>
                            <div className="kanban-column-body">
                                {stage.leads.map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={e => onDragStart(e, lead.id, stage.id)}
                                        onDragEnd={onDragEnd}
                                        style={{ cursor: 'grab' }}
                                    >
                                        <Link href={`/crm/${lead.id}`} style={{ textDecoration: 'none' }}>
                                            <div className="kanban-card">
                                                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F1C2E', marginBottom: 4 }}>{lead.name}</div>
                                                <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 10 }}>{lead.partnerName}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1F3A5F' }}>
                                                        {formatCurrency(Number(lead.expectedValue ?? 0))}
                                                    </span>
                                                    <div className="progress" style={{ width: 48 }}>
                                                        <div className="progress-bar" style={{ width: `${lead.probability}%`, background: color }} />
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 10, background: '#F0F2F5', color: '#4A5E78', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                                                        {lead.source}
                                                    </span>
                                                    <span style={{ fontSize: 10, color: '#CBD5E1' }}>{lead.probability}%</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                                <button
                                    onClick={() => openCreate(stage.id)}
                                    style={{
                                        width: '100%', padding: '8px', border: '1.5px dashed #CBD5E1',
                                        borderRadius: 8, background: 'transparent', cursor: 'pointer',
                                        color: '#8FA3BF', fontSize: 13, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 6, transition: 'all 0.15s ease'
                                    }}
                                >
                                    + ThÃªm lead
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Create Lead Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: '#fff', borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E' }}>Táº¡o Lead Má»i</h2>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>â</button>
                        </div>
                        <form action={handleCreate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">TÃªn lead *</label>
                                    <input className="form-input" name="name" placeholder="VD: Biá»t thá»± Tháº£o Äiá»n" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">KhÃ¡ch hÃ ng *</label>
                                    <input className="form-input" name="partnerName" placeholder="Ãng/BÃ  Nguyá»n VÄn A" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" name="email" type="email" placeholder="email@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SÄT</label>
                                        <input className="form-input" name="phone" placeholder="09xx xxx xxx" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Nguá»n</label>
                                        <select className="form-input" name="source" defaultValue="">
                                            <option value="">â Chá»n â</option>
                                            <option>Website</option>
                                            <option>Facebook</option>
                                            <option>Giá»i thiá»u</option>
                                            <option>Äáº¡i lÃ½</option>
                                            <option>Sá»± kiá»n</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">GiÃ¡ trá» Æ°á»c tÃ­nh</label>
                                        <input className="form-input" name="expectedValue" type="number" min="0" placeholder="0" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ghi chÃº</label>
                                    <textarea className="form-textarea" name="notes" rows={2} placeholder="MÃ´ táº£ ngáº¯n..." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Huá»·</button>
                                <button type="submit" className="btn btn-primary">Táº¡o Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
