'use client'

import { formatCurrency } from '@/lib/utils'

type Line = { id?: string; description: string; qty: number; unitPrice: number; subtotal?: number }

interface SaleOrderLinesProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order: any
    lines: Line[]
    setLines: React.Dispatch<React.SetStateAction<Line[]>>
    canEdit: boolean
    editing: boolean
    setEditing: (v: boolean) => void
    saving: boolean
    onSave: () => Promise<void>
    totalAmount: number
}

export default function SaleOrderLines({
    order, lines, setLines, canEdit, editing, setEditing, saving, onSave, totalAmount,
}: SaleOrderLinesProps) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Chi tiết dịch vụ</div>
                {canEdit && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { if (editing) onSave(); else setEditing(true) }}>
                        {saving ? '⏳' : editing ? '💾 Lưu' : '✏️ Sửa'}
                    </button>
                )}
            </div>

            {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lines.map((line, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 100px 30px', gap: 6 }}>
                            <input className="form-input" value={line.description} placeholder="Mô tả..."
                                onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, description: e.target.value } : l))} />
                            <input className="form-input" type="number" value={line.qty} style={{ textAlign: 'center' }}
                                onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, qty: +e.target.value || 1 } : l))} />
                            <input className="form-input" type="number" value={line.unitPrice || ''} placeholder="0" style={{ textAlign: 'right' }}
                                onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, unitPrice: +e.target.value || 0 } : l))} />
                            <button onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8FA3BF' }}>✕</button>
                        </div>
                    ))}
                    <button onClick={() => setLines(prev => [...prev, { description: '', qty: 1, unitPrice: 0 }])}
                        className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1', width: 'fit-content' }}>+ Thêm dòng</button>
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#1F3A5F', marginTop: 8 }}>
                        Tổng: {formatCurrency(totalAmount)}
                    </div>
                </div>
            ) : (
                <table className="data-table" style={{ fontSize: 13 }}>
                    <thead><tr><th>Mô tả</th><th style={{ textAlign: 'center' }}>SL</th><th style={{ textAlign: 'right' }}>Đơn giá</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                    <tbody>
                        {(order.lines || []).length === 0 ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có dịch vụ</td></tr>
                        ) : (order.lines || []).map((l: Line) => (
                            <tr key={l.id}>
                                <td style={{ fontWeight: 500 }}>{l.description}</td>
                                <td style={{ textAlign: 'center', color: '#8FA3BF' }}>{l.qty}</td>
                                <td style={{ textAlign: 'right', color: '#4A5E78' }}>{formatCurrency(Number(l.unitPrice || 0))}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(l.subtotal || 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr style={{ background: '#F8F9FB' }}>
                        <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right' }}>Tổng</td>
                        <td style={{ fontWeight: 800, textAlign: 'right', color: '#1F3A5F' }}>{formatCurrency(Number(order.totalAmount))}</td>
                    </tr></tfoot>
                </table>
            )}
        </div>
    )
}
