'use client'

import { useState, useTransition } from 'react'
import { getAuditLogs, type AuditLogEntry } from '@/lib/actions/audit'

const ACTION_ICONS: Record<string, string> = {
    LOGIN: '🔑',
    CREATE: '➕',
    UPDATE: '✏️',
    DELETE: '🗑️',
    APPROVE: '✅',
    REJECT: '❌',
    EXPORT: '📤',
    IMPORT: '📥',
}

const ACTION_COLORS: Record<string, string> = {
    LOGIN: '#3b82f6',
    CREATE: '#10b981',
    UPDATE: '#f59e0b',
    DELETE: '#ef4444',
    APPROVE: '#10b981',
    REJECT: '#ef4444',
    EXPORT: '#8b5cf6',
    IMPORT: '#06b6d4',
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} ngày trước`
    return formatDate(dateStr)
}

export default function AuditLogViewer({
    initialLogs,
    initialTotal,
    availableActions,
    availableEntities,
}: {
    initialLogs: AuditLogEntry[]
    initialTotal: number
    availableActions: string[]
    availableEntities: string[]
}) {
    const [logs, setLogs] = useState(initialLogs)
    const [total, setTotal] = useState(initialTotal)
    const [page, setPage] = useState(1)
    const [actionFilter, setActionFilter] = useState('')
    const [entityFilter, setEntityFilter] = useState('')
    const [isPending, startTransition] = useTransition()
    const limit = 50
    const totalPages = Math.ceil(total / limit)

    function applyFilters(newPage: number, action?: string, entity?: string) {
        const a = action ?? actionFilter
        const e = entity ?? entityFilter
        startTransition(async () => {
            const result = await getAuditLogs({
                page: newPage,
                limit,
                action: a || undefined,
                entity: e || undefined,
            })
            if (result.success) {
                setLogs(result.data.logs)
                setTotal(result.data.total)
                setPage(newPage)
            }
        })
    }

    return (
        <div>
            {/* Filters */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Hành động:</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); applyFilters(1, e.target.value, undefined) }}
                        style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.85rem',
                        }}
                    >
                        <option value="">Tất cả</option>
                        {availableActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Đối tượng:</label>
                    <select
                        value={entityFilter}
                        onChange={(e) => { setEntityFilter(e.target.value); applyFilters(1, undefined, e.target.value) }}
                        style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.85rem',
                        }}
                    >
                        <option value="">Tất cả</option>
                        {availableEntities.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {total} bản ghi {isPending && <span style={{ marginLeft: 8 }}>⏳</span>}
                </div>
            </div>

            {/* Timeline */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {logs.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                        <p>Chưa có hoạt động nào được ghi nhận</p>
                    </div>
                ) : (
                    <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                        {logs.map((log, i) => (
                            <div
                                key={log.id}
                                style={{
                                    display: 'flex', gap: 16, padding: '14px 20px',
                                    borderBottom: i < logs.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    alignItems: 'flex-start',
                                    transition: 'background 0.15s',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.03))')}
                                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Action icon */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `${ACTION_COLORS[log.action] ?? '#6b7280'}15`,
                                    border: `1px solid ${ACTION_COLORS[log.action] ?? '#6b7280'}30`,
                                    fontSize: '1rem', flexShrink: 0,
                                }}>
                                    {ACTION_ICONS[log.action] ?? '📝'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {log.userName ?? 'Hệ thống'}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem',
                                            fontWeight: 600, letterSpacing: '0.03em',
                                            background: `${ACTION_COLORS[log.action] ?? '#6b7280'}20`,
                                            color: ACTION_COLORS[log.action] ?? '#6b7280',
                                        }}>
                                            {log.action}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem',
                                            background: 'var(--color-surface)', color: 'var(--color-text-secondary)',
                                            border: '1px solid var(--color-border)',
                                        }}>
                                            {log.entity}
                                        </span>
                                    </div>
                                    {log.details && (
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            {log.details}
                                        </p>
                                    )}
                                </div>

                                {/* Time */}
                                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                        {timeAgo(log.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button
                        onClick={() => applyFilters(page - 1)}
                        disabled={page <= 1 || isPending}
                        className="btn btn-ghost"
                        style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                        ← Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        Trang {page}/{totalPages}
                    </span>
                    <button
                        onClick={() => applyFilters(page + 1)}
                        disabled={page >= totalPages || isPending}
                        className="btn btn-ghost"
                        style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                    >
                        Tiếp →
                    </button>
                </div>
            )}
        </div>
    )
}
