'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { createLead, moveLeadStage } from '@/lib/actions/crm'
import { useToast, ToastContainer } from '@/components/Toast'

type Lead = { id: string; name: string; partnerName: string; expectedValue: any; probability: number; source: string; stageId: string; email?: string; phone?: string }
type Stage = { id: string; name: string; sequence: number; probability: number; leads: Lead[] }

const stageColors: Record<string, string> = {
    'Leads mới': '#8FA3BF', 'Liên hệ': '#3B82F6', 'Đề xuất': '#F59E0B',
    'Đàm phán': '#C9A84C', 'Thắng': '#22C55E',
}

export default function CRMKanban({ initialStages }: { initialStages: Stage[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [stages, setStages] = useState(initialStages)
    const [showModal, setShowModal] = useState(false)
    const [modalStageId, setModalStageId] = useState<string | null>(null)
    const dragRef = useRef<{ leadId: string; fromStageId: string } | null>(null)

    // ── Drag & Drop ──
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
            addToast(`Đã chuyển sang ${toStage?.name ?? 'stage mới'}`)
        } catch {
            addToast('Lỗi khi chuyển stage', 'error')
            router.refresh()
        }
        dragRef.current = null
    }

    // ── Create Lead Modal ──
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

        if (!data.name || !data.partnerName) { addToast('Vui lòng nhập tên lead và khách hàng', 'error'); return }

        const result = await createLead(data)
        if (!result.success) { addToast(result.error || 'Lỗi khi tạo lead', 'error'); return }
        setStages(prev => prev.map(s =>
            s.id === modalStageId ? { ...s, leads: [...s.leads, result.data as Lead] } : s
        ))
        setShowModal(false)
        addToast(`Đã tạo lead "${data.name}"`)

    }

    const allLeads = stages.flatMap(s => s.leads)
    const totalPipelineValue = allLeads.reduce((s, l) => s + Number(l.expectedValue ?? 0), 0)

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">CRM & Leads</h1>
                    <p className="page-subtitle">{allLeads.length} leads — Pipeline: {formatCurrency(totalPipelineValue)}</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => openCreate()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Thêm Lead
                    </button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tổng leads', value: `${allLeads.length}`, icon: '👤' },
                    { label: 'Pipeline value', value: formatCurrency(totalPipelineValue), icon: '💰' },
                    { label: 'Đàm phán', value: `${stages.find(s => s.name === 'Đàm phán')?.leads.length ?? 0}`, icon: '🤝' },
                    { label: 'Đã thắng', value: `${stages.find(s => s.name === 'Thắng')?.leads.length ?? 0}`, icon: '🏆' },
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
                                    + Thêm lead
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
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E' }}>Tạo Lead Mới</h2>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>✕</button>
                        </div>
                        <form action={handleCreate}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Tên lead *</label>
                                    <input className="form-input" name="name" placeholder="VD: Biệt thự Thảo Điền" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Khách hàng *</label>
                                    <input className="form-input" name="partnerName" placeholder="Ông/Bà Nguyễn Văn A" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" name="email" type="email" placeholder="email@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SĐT</label>
                                        <input className="form-input" name="phone" placeholder="09xx xxx xxx" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Nguồn</label>
                                        <select className="form-input" name="source" defaultValue="">
                                            <option value="">— Chọn —</option>
                                            <option>Website</option>
                                            <option>Facebook</option>
                                            <option>Giới thiệu</option>
                                            <option>Đại lý</option>
                                            <option>Sự kiện</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Giá trị ước tính</label>
                                        <input className="form-input" name="expectedValue" type="number" min="0" placeholder="0" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ghi chú</label>
                                    <textarea className="form-textarea" name="notes" rows={2} placeholder="Mô tả ngắn..." />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Huỷ</button>
                                <button type="submit" className="btn btn-primary">Tạo Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
