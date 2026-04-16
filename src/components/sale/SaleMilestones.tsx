'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

type Milestone = { id?: string; name: string; percent: number | null; dueDate: string | null; state: string | null; amount?: number | null; invoiceId?: string | null }

const msStateLabels: Record<string, string> = { PAID: 'Đã thanh toán', INVOICED: 'Đã xuất HĐ', PENDING: 'Chưa đến hạn' }

interface SaleMilestonesProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order: any
    milestones: Milestone[]
    setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>
    isContract: boolean
    isQuotation: boolean
    canEdit: boolean
    editing: boolean
    setEditing: (v: boolean) => void
    saving: boolean
    onSave: () => Promise<void>
}

export default function SaleMilestones({
    order, milestones, setMilestones, isContract, isQuotation, canEdit, editing, setEditing, saving, onSave,
}: SaleMilestonesProps) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Milestones</div>
                {isContract && canEdit && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (editing) onSave(); else setEditing(true) }}>
                        {saving ? '⏳' : editing ? '💾 Lưu' : '✏️ Sửa'}
                    </button>
                )}
            </div>

            {editing ? (
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
                                <input className="form-input" type="number" value={ms.percent ?? 0} placeholder="%"
                                    onChange={e => setMilestones(prev => prev.map((m, j) => j === i ? { ...m, percent: +e.target.value || 0 } : m))} />
                                <input className="form-input" type="date" value={ms.dueDate || ''}
                                    onChange={e => setMilestones(prev => prev.map((m, j) => j === i ? { ...m, dueDate: e.target.value } : m))} />
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setMilestones(prev => [...prev, { name: `Milestone ${prev.length + 1}`, percent: 0, dueDate: '', state: 'PENDING' }])}
                        className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1' }}>+ Thêm milestone</button>
                    <div style={{ fontSize: 12, color: milestones.reduce((s, m) => s + (m.percent ?? 0), 0) === 100 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                        Tổng: {milestones.reduce((s, m) => s + (m.percent ?? 0), 0)}% {milestones.reduce((s, m) => s + (m.percent ?? 0), 0) !== 100 && '(cần = 100%)'}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(order.milestones || []).length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#8FA3BF', padding: 32 }}>
                            {isQuotation ? 'Milestones sẽ được cấu hình sau khi chuyển sang Hợp đồng' : 'Chưa có milestones'}
                        </div>
                    ) : (order.milestones || []).map((ms: Milestone, i: number) => (
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
                                <span className={`badge badge-${ms.state === 'PAID' ? 'success' : 'muted'}`}>{msStateLabels[ms.state ?? ''] || ms.state}</span>
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
    )
}
