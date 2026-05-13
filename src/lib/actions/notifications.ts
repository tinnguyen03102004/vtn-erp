'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ── Types ──

export interface Notification {
    id: string
    userId: string
    type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'invoice' | 'lead'
    title: string
    message: string | null
    link: string | null
    isRead: boolean
    createdAt: string
    readAt: string | null
}

// ── Get notifications for current user ──

export async function getNotifications(limit = 20): Promise<Notification[]> {
    const user = await requireAuth()

    const { data } = await db
        .from('notifications')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(limit)

    return (data || []) as Notification[]
}

// ── Get unread count ──

export async function getUnreadCount(): Promise<number> {
    const user = await requireAuth()

    const { data } = await db
        .from('notifications')
        .select('id')
        .eq('userId', user.id)
        .eq('isRead', false)

    return (data || []).length
}

// ── Mark as read ──

export async function markNotificationRead(notificationId: string): Promise<ActionResult<void>> {
    const user = await requireAuth()

    const { data: notif } = await db
        .from('notifications')
        .select('id, userId')
        .eq('id', notificationId)
        .single()

    if (!notif) return fail('Thông báo không tồn tại')
    if (notif.userId !== user.id) return fail('Không có quyền')

    await db.from('notifications').update({
        isRead: true,
        readAt: new Date().toISOString(),
    }).eq('id', notificationId)

    return ok(undefined as void)
}

// ── Mark all as read ──

export async function markAllRead(): Promise<ActionResult<void>> {
    const user = await requireAuth()

    await db.from('notifications').update({
        isRead: true,
        readAt: new Date().toISOString(),
    }).eq('userId', user.id).eq('isRead', false)

    return ok(undefined as void)
}

// ── Create notification (internal use) ──

export async function createNotification(params: {
    userId: string
    type: string
    title: string
    message?: string
    link?: string
}): Promise<void> {
    await db.from('notifications').insert({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message || null,
        link: params.link || null,
    })
}
