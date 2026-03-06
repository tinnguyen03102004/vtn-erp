'use server'

import { cookies } from 'next/headers'
import { hasPermission, canAccess, type Permission } from '@/lib/rbac'

type SessionUser = {
    id: string
    name: string
    email: string
    role: string
}

/**
 * Get current session user from vtn-session cookie. Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('vtn-session')?.value
    if (!sessionCookie) throw new Error('Unauthorized — vui lòng đăng nhập')

    try {
        const user = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
        if (!user?.id) throw new Error('Invalid session')
        return user as SessionUser
    } catch {
        throw new Error('Unauthorized — phiên đăng nhập không hợp lệ')
    }
}

/**
 * Check permission. Throws if user lacks it.
 */
export async function requirePermission(permission: Permission) {
    const user = await requireAuth()
    if (!hasPermission(user.role, permission)) {
        throw new Error(`Forbidden — Bạn không có quyền "${permission}"`)
    }
    return user
}

/**
 * Check module access. Throws if user lacks it.
 */
export async function requireModuleAccess(module: string) {
    const user = await requireAuth()
    if (!canAccess(user.role, module)) {
        throw new Error(`Forbidden — Bạn không có quyền truy cập module "${module}"`)
    }
    return user
}
