'use client'

import { useState } from 'react'
import { saveSettings } from '@/lib/actions/settings'
import { useToast, ToastContainer } from '@/components/Toast'
import UserManagement from '@/components/UserManagement'

type Tab = 'company' | 'users' | 'security'

const settingsFields = [
    { key: 'companyName', label: 'Tên công ty' },
    { key: 'taxCode', label: 'Mã số thuế' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'phone', label: 'Điện thoại' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
]

type SettingsContentProps = {
    initialSettings: Record<string, string>
    initialUsers: Array<Record<string, unknown>>
    canManageUsers: boolean
}

export default function SettingsContent({
    initialSettings,
    initialUsers,
    canManageUsers,
}: SettingsContentProps) {
    const [tab, setTab] = useState<Tab>('company')
    const { toasts, addToast } = useToast()
    const [form, setForm] = useState(initialSettings)
    const [invoiceNotes, setInvoiceNotes] = useState(initialSettings.invoiceNotes ?? '')
    const [saving, setSaving] = useState(false)
    const tabs: Array<{ key: Tab; label: string }> = [
        { key: 'company', label: 'Công ty' },
        ...(canManageUsers ? [{ key: 'users' as const, label: 'Tài khoản' }] : []),
        { key: 'security', label: 'Bảo mật' },
    ]

    async function handleSave() {
        setSaving(true)
        try {
            const result = await saveSettings({ ...form, invoiceNotes })
            if (result.success) {
                addToast('Đã lưu cài đặt')
            } else {
                addToast(result.error || 'Lỗi khi lưu cài đặt', 'error')
            }
        } catch (err: unknown) {
            addToast(err instanceof Error ? err.message : 'Lỗi', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Cài đặt</h1>
                    <p className="page-subtitle">Quản lý thông tin công ty, tài khoản người dùng và bảo mật</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div className="card" style={{ width: 200, padding: 8, flexShrink: 0 }}>
                    {tabs.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '9px 14px',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                background: tab === item.key ? '#EFF3FA' : 'transparent',
                                color: tab === item.key ? '#1F3A5F' : '#4A5E78',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1 }}>
                    {tab === 'company' && (
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Thông tin Công ty</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {settingsFields.map((field) => (
                                    <div key={field.key} className="form-group">
                                        <label className="form-label">{field.label}</label>
                                        <input
                                            className="form-input"
                                            value={form[field.key] ?? ''}
                                            onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Ghi chú / Điều khoản mặc định (trên hóa đơn)</label>
                                    <textarea
                                        className="form-textarea"
                                        value={invoiceNotes}
                                        onChange={(e) => setInvoiceNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: 24 }}>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'users' && canManageUsers && (
                        <div className="card" style={{ padding: 28 }}>
                            <UserManagement initialUsers={initialUsers} />
                        </div>
                    )}

                    {tab === 'security' && (
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Bảo mật Tài khoản</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                                {[
                                    { label: 'Mật khẩu hiện tại', type: 'password' },
                                    { label: 'Mật khẩu mới', type: 'password' },
                                    { label: 'Xác nhận mật khẩu mới', type: 'password' },
                                ].map((field) => (
                                    <div key={field.label} className="form-group">
                                        <label className="form-label">{field.label}</label>
                                        <input className="form-input" type={field.type} placeholder="••••••••" />
                                    </div>
                                ))}
                                <button className="btn btn-primary" style={{ width: 'fit-content' }}>Đổi mật khẩu</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
