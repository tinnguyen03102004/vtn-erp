'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { createOrder, addMilestone } from '@/lib/actions/sale'

type Line = { id: string; description: string; qty: number; unitPrice: number }
type Milestone = { id: string; name: string; percent: number; dueDate: string }

export default function NewSalePage() {
    const router = useRouter()
    const [partnerName, setPartnerName] = useState('')
    const [partnerEmail, setPartnerEmail] = useState('')
    const [partnerPhone, setPartnerPhone] = useState('')
    const [validityDate, setValidityDate] = useState('')
    const [notes, setNotes] = useState('Thanh toÃ¡n qua chuyá»n khoáº£n:\nCÃ´ng ty TNHH VÃµ Trá»ng NghÄ©a\nTK: 007.100.238.2826\nNgÃ¢n hÃ ng Ngoáº¡i thÆ°Æ¡ng Viá»t Nam (Vietcombank) â CN Há» ChÃ­ Minh\nMST: 0303506388')
    const [lines, setLines] = useState<Line[]>([
        { id: '1', description: 'Thiáº¿t káº¿ kiáº¿n trÃºc sÆ¡ bá»', qty: 1, unitPrice: 0 },
        { id: '2', description: 'Thiáº¿t káº¿ kiáº¿n trÃºc ká»¹ thuáº­t thi cÃ´ng', qty: 1, unitPrice: 0 },
    ])
    const [milestones, setMilestones] = useState<Milestone[]>([
        { id: '1', name: 'Táº¡m á»©ng 30%', percent: 30, dueDate: '' },
        { id: '2', name: 'HoÃ n thÃ nh thiáº¿t káº¿ cÆ¡ sá»', percent: 25, dueDate: '' },
        { id: '3', name: 'HoÃ n thÃ nh thiáº¿t káº¿ ká»¹ thuáº­t', percent: 25, dueDate: '' },
        { id: '4', name: 'Nghiá»m thu hoÃ n cÃ´ng', percent: 20, dueDate: '' },
    ])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const totalAmount = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    const totalPercent = milestones.reduce((s, m) => s + m.percent, 0)

    function addLine() {
        setLines(prev => [...prev, { id: Date.now().toString(), description: '', qty: 1, unitPrice: 0 }])
    }
    function removeLine(id: string) {
        setLines(prev => prev.filter(l => l.id !== id))
    }
    function updateLine(id: string, field: keyof Line, value: string | number) {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    }

    async function handleSave(_state: string) {
        if (!partnerName.trim()) { setError('Vui lÃ²ng nháº­p tÃªn khÃ¡ch hÃ ng'); return }
        if (totalAmount <= 0) { setError('Tá»ng giÃ¡ trá» pháº£i lá»n hÆ¡n 0'); return }

        setError('')
        setSaving(true)
        try {
            const result = await createOrder({
                partnerName: partnerName.trim(),
                partnerEmail: partnerEmail || null,
                partnerPhone: partnerPhone || null,
                totalAmount,
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
                        amount: Math.round(totalAmount * ms.percent / 100),
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
            setError(err.message || 'Lá»-i khi lÆ°u')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13, color: '#8FA3BF' }}>
                <Link href="/sale" style={{ color: '#8FA3BF', textDecoration: 'none' }}>BÃ¡o giÃ¡ & HÄ</Link>
                <span>âº</span>
                <span style={{ color: '#0F1C2E', fontWeight: 600 }}>Táº¡o bÃ¡o giÃ¡ má»i</span>
            </div>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <h1 className="page-title">Táº¡o BÃ¡o giÃ¡ má»i</h1>
                <div className="page-actions">
                    <Link href="/sale" className="btn btn-ghost btn-sm">Huá»·</Link>
                    <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => handleSave('DRAFT')}>
                        {saving ? '...' : 'LÆ°u nhÃ¡p'}
                    </button>
                    <button className="btn btn-primary" disabled={saving} onClick={() => handleSave('SENT')}>
                        {saving ? 'â³ Äang lÆ°u...' : 'ð¤ Gá»­i cho khÃ¡ch hÃ ng'}
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
                    {/* Customer info */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>ThÃ´ng tin khÃ¡ch hÃ ng</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">TÃªn khÃ¡ch hÃ ng *</label>
                                <input className="form-input" placeholder="Ãng/BÃ  Nguyá»n VÄn A hoáº·c TÃªn cÃ´ng ty" value={partnerName} onChange={e => setPartnerName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" placeholder="email@example.com" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Äiá»n thoáº¡i</label>
                                <input className="form-input" placeholder="09xx xxx xxx" value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hiá»u lá»±c Äáº¿n</label>
                                <input className="form-input" type="date" value={validityDate} onChange={e => setValidityDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Dá»ch vá»¥ / Háº¡ng má»¥c</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 130px 36px', gap: 8, fontSize: 11, fontWeight: 700, color: '#8FA3BF', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 4px' }}>
                                <span>MÃ´ táº£ dá»ch vá»¥</span>
                                <span style={{ textAlign: 'center' }}>SL</span>
                                <span style={{ textAlign: 'right' }}>ÄÆ¡n giÃ¡</span>
                                <span style={{ textAlign: 'right' }}>ThÃ nh tiá»n</span>
                                <span />
                            </div>

                            {lines.map(line => (
                                <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 130px 36px', gap: 8 }}>
                                    <input className="form-input" value={line.description} placeholder="MÃ´ táº£ dá»ch vá»¥..." onChange={e => updateLine(line.id, 'description', e.target.value)} />
                                    <input className="form-input" type="number" min="1" value={line.qty} style={{ textAlign: 'center' }} onChange={e => updateLine(line.id, 'qty', parseFloat(e.target.value) || 1)} />
                                    <input className="form-input" type="number" min="0" value={line.unitPrice || ''} placeholder="0" style={{ textAlign: 'right' }} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 700, fontSize: 13, color: '#1F3A5F', padding: '0 4px' }}>
                                        {formatCurrency(line.qty * line.unitPrice)}
                                    </div>
                                    <button onClick={() => removeLine(line.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#8FA3BF', padding: 4 }}>â</button>
                                </div>
                            ))}

                            <button onClick={addLine} className="btn btn-ghost btn-sm" style={{ width: 'fit-content', marginTop: 4, border: '1.5px dashed #CBD5E1', borderRadius: 6 }}>
                                + ThÃªm dÃ²ng
                            </button>

                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 4px 0', borderTop: '2px solid #F0F2F5', marginTop: 8 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 4 }}>Tá»ng giÃ¡ trá» há»£p Äá»ng</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1F3A5F' }}>{formatCurrency(totalAmount)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Ghi chÃº / Äiá»u khoáº£n</div>
                        <textarea className="form-textarea" rows={3} placeholder="Äiá»u khoáº£n thanh toÃ¡n, ghi chÃº Äáº·c biá»t..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                {/* Right: milestones */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Lá»ch thanh toÃ¡n Milestones</div>
                    <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 16 }}>
                        Tá»ng: {totalPercent}% {totalPercent !== 100 && <span style={{ color: '#EF4444' }}>(cáº§n = 100%)</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {milestones.map((ms, i) => (
                            <div key={ms.id} style={{ border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EFF3FA', color: '#1F3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <input className="form-input" value={ms.name} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, name: e.target.value } : m))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8 }}>
                                    <div className="form-group">
                                        <label className="form-label">%</label>
                                        <input className="form-input" type="number" value={ms.percent} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, percent: parseFloat(e.target.value) || 0 } : m))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sá» tiá»n</label>
                                        <div style={{ padding: '9px 12px', background: '#F8F9FB', borderRadius: 4, fontSize: 13, fontWeight: 700, color: '#1F3A5F', border: '1.5px solid #E2E8F0' }}>
                                            {formatCurrency(totalAmount * ms.percent / 100)}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Äáº¿n háº¡n</label>
                                        <input className="form-input" type="date" value={ms.dueDate} onChange={e => setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, dueDate: e.target.value } : m))} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setMilestones(prev => [...prev, { id: Date.now().toString(), name: `Milestone ${prev.length + 1}`, percent: 0, dueDate: '' }])}
                            className="btn btn-ghost btn-sm" style={{ border: '1.5px dashed #CBD5E1', borderRadius: 6 }}>
                            + ThÃªm milestone
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
