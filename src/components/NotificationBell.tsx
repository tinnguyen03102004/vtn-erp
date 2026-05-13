'use client'

import { useState, useEffect, useCallback } from 'react'
import { getNotifications, getUnreadCount, markNotificationRead, markAllRead, type Notification } from '@/lib/actions/notifications'

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    return `${Math.floor(hours / 24)} ngày trước`
}

const TYPE_ICONS: Record<string, string> = {
    task: '📋', invoice: '📄', lead: '🤝', success: '✅',
    warning: '⚠️', error: '❌', info: 'ℹ️',
}

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchCount = useCallback(async () => {
        try {
            const count = await getUnreadCount()
            setUnreadCount(count)
        } catch { /* silent */ }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch + setState on mount
        fetchCount()
        const interval = setInterval(fetchCount, 30_000) // Poll every 30s
        return () => clearInterval(interval)
    }, [fetchCount])

    const handleOpen = async () => {
        setOpen(!open)
        if (!open) {
            setLoading(true)
            try {
                const data = await getNotifications(15)
                setNotifications(data)
            } catch { /* silent */ }
            setLoading(false)
        }
    }

    const handleRead = async (id: string, link: string | null) => {
        await markNotificationRead(id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
        if (link) window.location.assign(link)
    }

    const handleMarkAllRead = async () => {
        await markAllRead()
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
    }


    return (
        <div style={{ position: 'relative' }}>
            <button
                className="btn btn-ghost btn-icon"
                title="Thông báo"
                onClick={handleOpen}
                style={{ position: 'relative' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="notification-overlay" onClick={() => setOpen(false)} />
                    <div className="notification-panel">
                        <div className="notification-header">
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Thông báo</span>
                            {unreadCount > 0 && (
                                <button
                                    className="notification-mark-all"
                                    onClick={handleMarkAllRead}
                                >
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>
                        <div className="notification-list">
                            {loading ? (
                                <div className="notification-empty">Đang tải...</div>
                            ) : notifications.length === 0 ? (
                                <div className="notification-empty">Không có thông báo</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`notification-item ${n.isRead ? '' : 'unread'}`}
                                        onClick={() => handleRead(n.id, n.link)}
                                    >
                                        <span className="notification-icon">{TYPE_ICONS[n.type] || 'ℹ️'}</span>
                                        <div className="notification-content">
                                            <div className="notification-title">{n.title}</div>
                                            {n.message && <div className="notification-message">{n.message}</div>}
                                            <div className="notification-time">{timeAgo(n.createdAt)}</div>
                                        </div>
                                        {!n.isRead && <span className="notification-dot" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .notification-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background: #EF4444;
                    color: #fff;
                    font-size: 10px;
                    font-weight: 700;
                    min-width: 16px;
                    height: 16px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    line-height: 1;
                }
                .notification-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 199;
                }
                .notification-panel {
                    position: absolute;
                    right: 0;
                    top: calc(100% + 8px);
                    width: 360px;
                    max-height: 480px;
                    background: #fff;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    z-index: 200;
                    overflow: hidden;
                    animation: fadeIn 0.15s ease;
                }
                .notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--color-border);
                }
                .notification-mark-all {
                    background: none;
                    border: none;
                    color: var(--color-primary);
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .notification-mark-all:hover {
                    text-decoration: underline;
                }
                .notification-list {
                    overflow-y: auto;
                    max-height: 400px;
                }
                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.1s;
                    position: relative;
                }
                .notification-item:hover {
                    background: var(--color-surface);
                }
                .notification-item.unread {
                    background: #F0F7FF;
                }
                .notification-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .notification-content {
                    flex: 1;
                    min-width: 0;
                }
                .notification-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--color-text-primary);
                    line-height: 1.3;
                }
                .notification-message {
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    margin-top: 2px;
                    line-height: 1.3;
                }
                .notification-time {
                    font-size: 11px;
                    color: var(--color-text-muted, #8FA3BF);
                    margin-top: 4px;
                }
                .notification-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 4px;
                    background: var(--color-primary, #2563EB);
                    flex-shrink: 0;
                    margin-top: 6px;
                }
                .notification-empty {
                    padding: 40px 16px;
                    text-align: center;
                    color: var(--color-text-secondary);
                    font-size: 13px;
                }
            `}</style>
        </div>
    )
}
