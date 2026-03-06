'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import GlobalSearch from '@/components/GlobalSearch'

interface HeaderProps {
    title: string
    user?: {
        name: string
        email: string
        role: string
    }
}

const roleLabels: Record<string, { label: string; color: string }> = {
    DIRECTOR: { label: 'Giám đốc', color: '#1F3A5F' },
    PROJECT_MANAGER: { label: 'Quản lý DA', color: '#2A4D7F' },
    ARCHITECT: { label: 'Kiến trúc sư', color: '#C9A84C' },
    FINANCE: { label: 'Kế toán', color: '#22C55E' },
    SALES: { label: 'Kinh doanh', color: '#3B82F6' },
}

const avatarColors = ['#1F3A5F', '#2A6496', '#8B5E3C', '#1A6B47', '#6B3FA0']

export function Header({ title, user }: HeaderProps) {
    const [showMenu, setShowMenu] = useState(false)
    const { logout } = useAuth()
    const role = user?.role || 'ARCHITECT'
    const roleInfo = roleLabels[role] || { label: role, color: '#8FA3BF' }
    const initials = getInitials(user?.name || 'User')
    const avatarColor = avatarColors[initials.charCodeAt(0) % avatarColors.length]

    return (
        <header className="header">
            <GlobalSearch />

            <div className="header-actions">
                {/* Notifications */}
                <button className="btn btn-ghost btn-icon" title="Thông báo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                </button>

                {/* Quick add */}
                <button className="btn btn-outline btn-sm" onClick={() => { }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tạo mới
                </button>

                {/* User menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="user-menu-trigger"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <div
                            className="avatar avatar-sm"
                            style={{ background: avatarColor }}
                        >
                            {initials}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-role" style={{ color: roleInfo.color }}>{roleInfo.label}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8FA3BF' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="user-dropdown" onClick={() => setShowMenu(false)}>
                            <div className="user-dropdown-header">
                                <div className="avatar avatar-md" style={{ background: avatarColor }}>{initials}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
                                    <div style={{ fontSize: 12, color: '#8FA3BF' }}>{user?.email}</div>
                                </div>
                            </div>
                            <hr className="divider" style={{ margin: '8px 0' }} />
                            <Link href="/settings/profile" className="user-dropdown-item">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                                Hồ sơ cá nhân
                            </Link>
                            <Link href="/settings" className="user-dropdown-item">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                                </svg>
                                Cài đặt
                            </Link>
                            <hr className="divider" style={{ margin: '8px 0' }} />
                            <button onClick={logout} className="user-dropdown-item" style={{ width: '100%', color: '#EF4444' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border: 1.5px solid var(--color-border);
          border-radius: 40px;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .user-menu-trigger:hover {
          background: var(--color-surface);
          border-color: var(--color-border-strong);
        }
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1;
        }
        .user-role {
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          margin-top: 2px;
        }
        .user-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: #fff;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 200;
          padding: 8px;
          animation: fadeIn 0.15s ease;
        }
        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 4px;
        }
        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.1s ease;
          text-decoration: none;
          border: none;
          background: none;
        }
        .user-dropdown-item:hover {
          background: var(--color-surface);
          color: var(--color-text-primary);
        }
      `}</style>
        </header>
    )
}
