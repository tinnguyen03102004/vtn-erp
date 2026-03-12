'use client'

import { useState } from 'react'
import { saveSettings } from '@/lib/actions/settings'
import { useToast, ToastContainer } from '@/components/Toast'
import UserManagement from '@/components/UserManagement'

type Tab = 'company' | 'users' | 'security'

const settingsFields = [
    { key: 'companyName', label: 'TÃªn cÃ´ng ty' },
    { key: 'taxCode', label: 'MÃ£ sá» thuáº¿' },
    { key: 'address', label: 'Äá»a chá»' },
    { key: 'phone', label: 'Äiá»n thoáº¡i' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SettingsContent({ initialSettings, initialUsers }: { initialSettings: Record<string, string>; initialUsers: any[] }) {
    const [tab, setTab] = useState<Tab>('company')
    const { toasts, addToast } = useToast()
    const [form, setForm] = useState(initialSettings)
    const [invoiceNotes, setInvoiceNotes] = useState(initialSettings.invoiceNotes ?? '')
    const [saving, setSaving] = useState(false)

    async function handleSave() {
        setSaving(true)
        try { await saveSettings({ ...form, invoiceNotes }); addToast('ÄÃ£ lÆ°u cÃ i Äáº·t') }
        catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
        finally { setSaving(false) }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">CÃ i Äáº·t</h1>
                    <p className="page-subtitle">Quáº£n lÃ½ thÃ´ng tin cÃ´ng ty, tÃ i khoáº£n ngÆ°á»i dÃ¹ng vÃ  báº£o máº­t</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div className="card" style={{ width: 200, padding: 8, flexShrink: 0 }}>
                    {[
                        { key: 'company', label: 'ð¢ CÃ´ng ty' },
                        { key: 'users', label: 'ð¥ TÃ i khoáº£n' },
                        { key: 'security', label: 'ð Báº£o máº­t' },
                    ].map(item => (
                        <button key={item.key} onClick={() => setTab(item.key as Tab)}
                            style={{
                                display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                                borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                background: tab === item.key ? '#EFF3FA' : 'transparent',
                                color: tab === item.key ? '#1F3A5F' : '#4A5E78',
                                transition: 'all 0.15s ease',
                            }}>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1 }}>
                    {tab === 'company' && (
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>ThÃ´ng tin CÃ´ng ty</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {settingsFields.map(f => (
                                    <div key={f.key} className="form-group">
                                        <label className="form-label">{f.label}</label>
                                        <input className="form-input" value={form[f.key] ?? ''}
                                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                                    </div>
                                ))}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Ghi chÃº / Äiá»u khoáº£n máº·c Äá»nh (trÃªn hÃ³a ÄÆ¡n)</label>
                                    <textarea className="form-textarea" value={invoiceNotes}
                                        onChange={e => setInvoiceNotes(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'â³ Äang lÆ°u...' : 'ð¾ LÆ°u thay Äá»i'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'users' && (
                        <div className="card" style={{ padding: 28 }}>
                            <UserManagement initialUsers={initialUsers} />
                        </div>
                    )}

                    {tab === 'security' && (
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Báº£o máº­t TÃ i khoáº£n</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                                {[
                                    { label: 'Máº­t kháº©u hiá»n táº¡i', type: 'password' },
                                    { label: 'Máº­t kháº©u má»i', type: 'password' },
                                    { label: 'XÃ¡c nháº­n máº­t kháº©u má»i', type: 'password' },
                                ].map(f => (
                                    <div key={f.label} className="form-group">
                                        <label className="form-label">{f.label}</label>
                                        <input className="form-input" type={f.type} placeholder="â¢â¢â¢â¢â¢â¢â¢â¢" />
                                    </div>
                                ))}
                                <button className="btn btn-primary" style={{ width: 'fit-content' }}>Äá»i máº­t kháº©u</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
