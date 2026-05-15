'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { createOrder, addMilestone, getCrmContacts } from '@/lib/actions/sale'

type Line = { id: string; description: string; qty: number; unit: string; unitPrice: number; discountPercent: number }
type Milestone = { id: string; name: string; percent: number; dueDate: string }
type CrmContact = { id: string; name: string; partnerName: string; email: string | null; phone: string | null }

const unitOptions = ['bộ', 'gói', 'm²', 'm³', 'tháng', 'lần', 'ngày', 'giờ', 'cái', 'hệ thống']

export default function NewSalePage() {
    const router = useRouter()
    const [contacts, setContacts] = useState<CrmContact[]>([])
    const [selectedLeadId, setSelectedLeadId] = useState('')
    const [partnerName, setPartnerName] = useState('')
    const [partnerEmail, setPartnerEmail] = useState('')
    const [partnerPhone, setPartnerPhone] = useState('')
    const [partnerAddress, setPartnerAddress] = useState('')
    const [partnerTaxCode, setPartnerTaxCode] = useState('')
    const [validityDate, setValidityDate] = useState('')
    const [discountPercent, setDiscountPercent] = useState(0)
    const [vatRate, setVatRate] = useState(10)
    const [notes, setNotes] = useState('Thanh toán qua chuyển khoản:\nCông ty TNHH Võ Trọng Nghĩa\nTK: 007.100.238.2826\nNgân hàng Ngoại thương Việt Nam (Vietcombank) — CN Hồ Chí Minh\nMST: 0303506388')
    const [lines, setLines] = useState<Line[]>([
        { id: '1', description: 'Thiết kế kiến trúc sơ bộ', qty: 1, unit: 'bộ', unitPrice: 0, discountPercent: 0 },
        { id: '2', description: 'Thiết kế kiến trúc kỹ thuật thi công', qty: 1, unit: 'bộ', unitPrice: 0, discountPercent: 0 },
    ])
    const [milestones, setMilestones] = useState<Milestone[]>([
        { id: '1', name: 'Tạm ứng 30%', percent: 30, dueDate: '' },
        { id: '2', name: 'Hoàn thành thiết kế cơ sở', percent: 25, dueDate: '' },
        { id: '3', name: 'Hoàn thành thiết kế kỹ thuật', percent: 25, dueDate: '' },
        { id: '4', name: 'Nghiệm thu hoàn công', percent: 20, dueDate: '' },
    ])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Load CRM contacts
    useEffect(() => {
        getCrmContacts().then(setContacts).catch(() => { /* ignore */ })
    }, [])

    function handleSelectContact(leadId: string) {
        setSelectedLeadId(leadId)
        const c = contacts.find(x => x.id === leadId)
        if (c) {
            setPartnerName(c.partnerName || c.name)
            setPartnerEmail(c.email || '')
            setPartnerPhone(c.phone || '')
        }
    }

    const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice * (1 - l.discountPercent / 100), 0)
    const discountAmt = Math.round(totalAmount * discountPercent / 100)
    const afterDiscount = totalAmount - discountAmt
    const vatAmt = Math.round(afterDiscount * vatRate / 100)
    const grandTotal = afterDiscount + vatAmt
    const totalPercent = milestones.reduce((s, m) => s + m.percent, 0)

    function addLine() {
        setLines(prev => [...prev, { id: Date.now().toString(), description: '', qty: 1, unit: 'bộ', unitPrice: 0, discountPercent: 0 }])
    }
    function removeLine(id: string) {
        setLines(prev => prev.filter(l => l.id !== id))
    }
    function updateLine(id: string, field: keyof Line, value: string | number) {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    }

    async function handleSave() {
        if (!partnerName.trim()) { setError('Vui lòng nhập tên khách hàng'); return }
        if (totalAmount <= 0) { setError('Tổng giá trị phải lớn hơn 0'); return }

        setError('')
        setSaving(true)
        try {
            const result = await createOrder({
                partnerName: partnerName.trim(),
                partnerEmail: partnerEmail || undefined,
                partnerPhone: partnerPhone || undefined,
                partnerAddress: partnerAddress || undefined,
                partnerTaxCode: partnerTaxCode || undefined,
                totalAmount,
                discountPercent,
                vatRate,
                validityDate: validityDate || undefined,
                leadId: selectedLeadId || null,
                notes: notes || null,
            })
            if (!result.success) { setError(result.error); setSaving(false); return }

            // Add milestones
            for (let i = 0; i < milestones.length; i++) {
                const ms = milestones[i]
                if (ms.name.trim()) {
                    const msResult = await addMilestone({
                        orderId: result.data.id as string,
                        name: ms.name,
                        percent: ms.percent,
                        amount: Math.round(grandTotal * ms.percent / 100),
                        dueDate: ms.dueDate || null,
                        sequence: i + 1,
                        state: 'PENDING',
                    })
                    if (!msResult.success) { setError(msResult.error); setSaving(false); return }
                }
            }

            router.push('/sale')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.message || 'Lỗi khi lưu')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/sale" style={{ color: '#8FA3BF', textDecoration: 'none' }}>Báo giá &amp; HĐ</Link>
                <span>›</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>Tạo báo giá mới</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <h1 className="page-title">Tạo Báo giá mới</h1>
                <div className="page-actions">
                    <Link href="/sale" className="btn btn-ghost btn-sm">Huỷ</Link>
                    <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                        {saving ? '⏳ Đang lưu...' : '💾 Lưu báo giá'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {error}
                </div>
            )}

            <div className="grid-2" style={{ alignItems: 'flex-start', gap: 20 }}>
                {/* Left: form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* CRM Contact picker */}
                    {contacts.length > 0 && (
                        <div className="card" style={{ padding: 16, background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#166534' }}>🔗 Chọn từ CRM</div>
                            <select className="form-input" value={selectedLeadId} onChange={e => handleSelectContact(e.target.value)}>
                                <option value="">— Nhập thủ công —</option>
                                {contacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.partnerName || c.name} {c.email ? `(${c.email})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Customer info */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Thông tin khách hàng</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Tên khách hàng *</label>
                                <input className="form-input" placeholder="Ông/Bà Nguyễn Văn A hoặc Tên công ty" value={partnerName} onChange={e => setPartnerName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" placeholder="email@example.com" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Điện thoại</label>
                                <input className="form-input" placeholder="09xx xxx xxx" value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Địa chỉ</label>
                                <input className="form-input" placeholder="Địa chỉ khách hàng..." value={partnerAddress} onChange={e => setPartnerAddress(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mã số thuế</label>
                                <input className="form-input" placeholder="0123456789" value={partnerTaxCode} onChange={e => setPartnerTaxCode(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hiệu lực đến</label>
                                <input className="form-input" type="date" value={validityDate} onChange={e => setValidityDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Dịch vụ / Hạng mục</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 110px 60px 110px 30px', gap: 6, fontSize: 10, fontWeight: 700, color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px' }}>
                                <span>Mô tả dịch vụ</span><span>ĐVT</span><span style={{ textAlign: 'center' }}>SL</span>
                                <span style={{ textAlign: 'right' }}>Đơn giá</span><span style={{ textAlign: 'center' }}>CK%</span>
                                <span style={{ textAlign: 'right' }}>Thành tiền</span><span />
                            </div>

                            {lines.map(line => {
                                const lineTotal = line.qty * line.unitPrice * (1 - line.discountPercent / 100)
                                return (
                                    <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 110px 60px 110px 30px', gap: 6 }}>
                                        <input className="form-input" value={line.description} placeholder="Mô tả dịch vụ..." onChange={e => updateLine(line.id, 'description', e.target.value)} />
                                        <select className="form-input" value={line.unit} onChange={e => updateLine(line.id, 'unit', e.target.value)}>
                                            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                        <input className="form-input" type="number" min="0.01" step="0.01" value={line.qty} style={{ textAlign: 'center' }} onChange={e => updateLine(line.id, 'qty', parseFloat(e.target.value) || 1)} />
                                        <input className="form-input" type="number" min="0" value={line.unitPrice || ''} placeholder="0" style={{ textAlign: 'right' }} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                        <input className="form-input" type="number" min="0" max="100" step="0.5" value={line.discountPercent || ''} placeholder="0" style={{ textAlign: 'center' }} onChange={e => updateLine(line.id, 'discountPercent', parseFloat(e.target.value) || 0)} />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 700, fontSize: 13, color: '#1F3A5F', padding: '0 4px' }}>
                                            {formatCurrency(Math.round(lineTotal))}
                                        </div>
                                        <button onClick={() => removeLine(line.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#8FA3BF', padding: 4 }}>✕</button>
                                    </div>
                                )
                            })}

                            <button onClick={addLine} className="btn btn-ghost btn-sm" style={{ width: 'fit-content', marginTop: 4, border: '1.5px dashed #CBD5E1', borderRadius: 6 }}>
                                + Thêm dòng
                            </button>

                            {/* Finance summary */}
                            <div style={{ borderTop: '2px solid #F0F2F5', marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                                    <span style={{ color: '#8FA3BF' }}>Tổng dịch vụ:</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(Math.round(totalAmount))}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
                                    <span style={{ color: '#8FA3BF' }}>Chiết khấu:</span>
                                    <input className="form-input" type="number" value={discountPercent || ''} min="0" max="100" step="0.5" placeholder="0"
                                        style={{ width: 60, textAlign: 'right', padding: '2px 6px', fontSize: 13 }}
                                        onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)} />
                                    <span style={{ fontSize: 12 }}>%</span>
                                    {discountAmt > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>-{formatCurrency(discountAmt)}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
                                    <span style={{ color: '#8FA3BF' }}>VAT:</span>
                                    <input className="form-input" type="number" value={vatRate} min="0" max="100" step="1"
                                        style={{ width: 60, textAlign: 'right', padding: '2px 6px', fontSize: 13 }}
                                        onChange={e => setVatRate(parseFloat(e.target.value) || 0)} />
                                    <span style={{ fontSize: 12 }}>%</span>
                                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>+{formatCurrency(vatAmt)}</span>
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F', marginTop: 4 }}>
                                    {formatCurrency(grandTotal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Ghi chú / Điều khoản</div>
                        <textarea className="form-textarea" rows={3} placeholder="Điều khoản thanh toán, ghi chú đặc biệt..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                {/* Right: milestones */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Lịch thanh toán Milestones</div>
                    <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 16 }}>
                        Tổng: {totalPercent}% {totalPercent !== 100 && <span style={{ color: '#EF4444' }}>(cần = 100%)</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {milestones.map((ms, i) => (
                            <div key={ms.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EFF3FA', color: '#1F3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <input className="form-input" value={ms.name} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, name: e.target.value } : m))} />
                                    <button onClick={() => setMilestones(prev => prev.filter(m => m.id !== ms.id))}
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8FA3BF' }}>✕</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8 }}>
                                    <div className="form-group">
                                        <label className="form-label">%</label>
                                        <input className="form-input" type="number" value={ms.percent} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, percent: parseFloat(e.target.value) || 0 } : m))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Số tiền</label>
                                        <div style={{ padding: '9px 12px', background: '#F8F9FB', borderRadius: 4, fontSize: 13, fontWeight: 700, color: '#1F3A5F', border: '1.5px solid #E2E8F0' }}>
                                            {formatCurrency(Math.round(grandTotal * ms.percent / 100))}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Đến hạn</label>
                                        <input className="form-input" type="date" value={ms.dueDate} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, dueDate: e.target.value } : m))} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setMilestones(prev => [...prev, { id: Date.now().toString(), name: `Milestone ${prev.length + 1}`, percent: 0, dueDate: '' }])}
                            className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1', borderRadius: 6 }}>
                            + Thêm milestone
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
