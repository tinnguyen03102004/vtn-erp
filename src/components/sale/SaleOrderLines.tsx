'use client'

import { formatCurrency } from '@/lib/utils'

type Line = { id?: string; description: string; qty: number | null; unit?: string | null; unitPrice: number | null; discountPercent?: number | null; vatRate?: number | null; subtotal?: number | null }

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

const unitOptions = ['bộ', 'gói', 'm²', 'm³', 'tháng', 'lần', 'ngày', 'giờ', 'cái', 'hệ thống']

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
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 100px 65px 110px 30px', gap: 6, fontSize: 10, fontWeight: 700, color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '.04em', padding: '0 4px' }}>
                        <span>Mô tả</span><span>ĐVT</span><span>SL</span><span>Đơn giá</span><span>CK%</span><span>Thành tiền</span><span/>
                    </div>
                    {lines.map((line, i) => {
                        const lineSubtotal = (line.qty ?? 0) * (line.unitPrice ?? 0) * (1 - ((line.discountPercent ?? 0)) / 100)
                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 100px 65px 110px 30px', gap: 6 }}>
                                <input className="form-input" value={line.description} placeholder="Mô tả..."
                                    onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, description: e.target.value } : l))} />
                                <select className="form-input" value={line.unit || 'bộ'}
                                    onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, unit: e.target.value } : l))}>
                                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <input className="form-input" type="number" value={line.qty ?? 0} min="0.01" step="0.01" style={{ textAlign: 'center' }}
                                    onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, qty: +e.target.value || 1 } : l))} />
                                <input className="form-input" type="number" value={line.unitPrice || ''} placeholder="0" style={{ textAlign: 'right' }}
                                    onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, unitPrice: +e.target.value || 0 } : l))} />
                                <input className="form-input" type="number" value={line.discountPercent || ''} placeholder="0" min="0" max="100" step="0.5" style={{ textAlign: 'center' }}
                                    onChange={e => setLines(prev => prev.map((l, j) => j === i ? { ...l, discountPercent: +e.target.value || 0 } : l))} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 700, fontSize: 13, color: '#1F3A5F', padding: '0 4px' }}>
                                    {formatCurrency(Math.round(lineSubtotal))}
                                </div>
                                <button onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8FA3BF' }}>✕</button>
                            </div>
                        )
                    })}
                    <button onClick={() => setLines(prev => [...prev, { description: '', qty: 1, unit: 'bộ', unitPrice: 0, discountPercent: 0 }])}
                        className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1', width: 'fit-content' }}>+ Thêm dòng</button>
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#1F3A5F', marginTop: 8 }}>
                        Tổng: {formatCurrency(Math.round(totalAmount))}
                    </div>
                </div>
            ) : (
                <table className="data-table" style={{ fontSize: 13 }}>
                    <thead><tr>
                        <th>Mô tả</th><th style={{ textAlign: 'center' }}>ĐVT</th><th style={{ textAlign: 'center' }}>SL</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ textAlign: 'center' }}>CK%</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    </tr></thead>
                    <tbody>
                        {(order.lines || []).length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>Chưa có dịch vụ</td></tr>
                        ) : (order.lines || []).map((l: Line) => (
                            <tr key={l.id}>
                                <td style={{ fontWeight: 500 }}>{l.description}</td>
                                <td style={{ textAlign: 'center', color: '#8FA3BF', fontSize: 12 }}>{l.unit || 'bộ'}</td>
                                <td style={{ textAlign: 'center', color: '#8FA3BF' }}>{l.qty}</td>
                                <td style={{ textAlign: 'right', color: '#4A5E78' }}>{formatCurrency(Number(l.unitPrice || 0))}</td>
                                <td style={{ textAlign: 'center', color: Number(l.discountPercent || 0) > 0 ? '#EF4444' : '#8FA3BF' }}>
                                    {Number(l.discountPercent || 0) > 0 ? `-${l.discountPercent}%` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(l.subtotal || 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr style={{ background: '#F8F9FB' }}>
                        <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>Tổng dịch vụ</td>
                        <td style={{ fontWeight: 800, textAlign: 'right', color: '#1F3A5F' }}>{formatCurrency(Number(order.totalAmount))}</td>
                    </tr></tfoot>
                </table>
            )}
        </div>
    )
}
