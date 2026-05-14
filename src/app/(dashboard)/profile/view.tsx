'use client'

import { useState, useTransition } from 'react'
import { updateProfile, type ProfileData } from '@/lib/actions/profile'

const ROLE_LABELS: Record<string, string> = {
    DIRECTOR: 'Giám đốc',
    PROJECT_MANAGER: 'Quản lý dự án',
    ARCHITECT: 'Kiến trúc sư',
    FINANCE: 'Kế toán / Tài chính',
    EMPLOYEE: 'Nhân viên',
}

const ROLE_COLORS: Record<string, string> = {
    DIRECTOR: '#ef4444',
    PROJECT_MANAGER: '#3b82f6',
    ARCHITECT: '#8b5cf6',
    FINANCE: '#10b981',
    EMPLOYEE: '#6b7280',
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
}

export default function ProfileView({ profile }: { profile: ProfileData }) {
    const [phone, setPhone] = useState(profile.phone ?? '')
    const [saved, setSaved] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSavePhone() {
        startTransition(async () => {
            const result = await updateProfile({ phone })
            if (result.success) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        })
    }

    const roleColor = ROLE_COLORS[profile.role] ?? '#6b7280'

    return (
        <div style={{ display: 'grid', gap: 20, maxWidth: 700 }}>
            {/* Avatar + Name Card */}
            <div className="card" style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}20)`,
                    border: `2px solid ${roleColor}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem', fontWeight: 700, color: roleColor,
                }}>
                    {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{profile.name}</h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {profile.email}
                    </p>
                    <span style={{
                        display: 'inline-block', marginTop: 8,
                        padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem',
                        fontWeight: 600, letterSpacing: '0.03em',
                        background: `${roleColor}15`, color: roleColor,
                        border: `1px solid ${roleColor}30`,
                    }}>
                        {ROLE_LABELS[profile.role] ?? profile.role}
                    </span>
                </div>
            </div>

            {/* Details Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Thông tin công việc</h3>
                </div>

                <div style={{ padding: '8px 0' }}>
                    {[
                        { label: 'Phòng ban', value: profile.department ?? '—' },
                        { label: 'Chức vụ', value: profile.position ?? '—' },
                        { label: 'Ngày vào làm', value: formatDate(profile.joinDate) },
                    ].map((item) => (
                        <div key={item.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 24px',
                        }}>
                            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Liên hệ</h3>
                </div>

                <div style={{ padding: '16px 24px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                        Số điện thoại
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0901 234 567"
                            style={{
                                flex: 1, padding: '8px 14px', borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface)', color: 'var(--color-text)',
                                fontSize: '0.9rem',
                            }}
                        />
                        <button
                            onClick={handleSavePhone}
                            disabled={isPending || phone === (profile.phone ?? '')}
                            className="btn btn-primary"
                            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                        >
                            {isPending ? '...' : saved ? '✓ Đã lưu' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
