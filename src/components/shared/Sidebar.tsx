'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
    {
        section: 'Tổng quan',
        items: [
            {
                href: '/dashboard',
                label: 'Dashboard',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'ARCHITECT', 'FINANCE', 'SALES'],
            },
        ],
    },
    {
        section: 'Kinh doanh',
        items: [
            {
                href: '/crm',
                label: 'CRM & Leads',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'SALES'],
            },
            {
                href: '/sale',
                label: 'Báo giá & HĐ',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'FINANCE', 'SALES'],
            },
        ],
    },
    {
        section: 'Dự án',
        items: [
            {
                href: '/projects',
                label: 'Quản lý dự án',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'ARCHITECT'],
            },
            {
                href: '/timesheets',
                label: 'Timesheet',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'ARCHITECT'],
            },
            {
                href: '/attendance/me',
                label: 'Chấm công',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <polyline points="9 16 11 18 15 14" />
                    </svg>
                ),
                roles: ['PROJECT_MANAGER', 'ARCHITECT', 'FINANCE'],
            },
        ],
    },
    {
        section: 'Tài chính',
        items: [
            {
                href: '/finance/invoices',
                label: 'Hóa đơn',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'FINANCE'],
            },
            {
                href: '/finance/costs',
                label: 'Chi phí dự án',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'FINANCE', 'PROJECT_MANAGER'],
            },
            {
                href: '/payroll',
                label: 'Bảng lương',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                        <path d="M12 14v3" /><path d="M8 14v1" /><path d="M16 14v1" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'FINANCE'],
            },
        ],
    },
    {
        section: 'Nhân sự',
        items: [
            {
                href: '/employees',
                label: 'Nhân viên',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER'],
            },
            {
                href: '/leave',
                label: 'Nghỉ phép',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M8 15l2 2 4-4" />
                    </svg>
                ),
                roles: ['DIRECTOR', 'PROJECT_MANAGER', 'ARCHITECT'],
            },
            {
                href: '/attendance',
                label: 'Quản lý chấm công',
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
                        <path d="M8 18h.01" /><path d="M12 18h.01" />
                    </svg>
                ),
                roles: ['DIRECTOR'],
            },
        ],
    },

]

export function Sidebar({ userRole }: { userRole?: string }) {
    const pathname = usePathname()

    function isActive(href: string) {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(href)
    }

    // Filter nav items by user role
    const filteredNav = navItems
        .map(section => ({
            ...section,
            items: section.items.filter(item =>
                !userRole || userRole === 'ADMIN' || item.roles.includes(userRole)
            ),
        }))
        .filter(section => section.items.length > 0)

    const settingsRoles = ['DIRECTOR', 'FINANCE']
    const canSeeSettings = !userRole || userRole === 'ADMIN' || settingsRoles.includes(userRole)

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-text">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <path d="M16 2L2 28h28L16 2z" fill="white" opacity="0.9" />
                        <path d="M16 8L6 26h20L16 8z" fill="white" opacity="0.15" />
                    </svg>
                    <span>VTN</span>
                    <span className="sidebar-logo-badge">ERP</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {filteredNav.map((section) => (
                    <div key={section.section}>
                        <div className="sidebar-section-title">{section.section}</div>
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn('sidebar-link', isActive(item.href) && 'active')}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            {canSeeSettings && (
                <div className="sidebar-footer">
                    <Link href="/settings" className={cn('sidebar-link', isActive('/settings') && 'active')} style={{ padding: '8px 0' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        <span>Cài đặt</span>
                    </Link>
                </div>
            )}
        </aside>
    )
}
