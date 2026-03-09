'use server'

import { getSessionFromCookies, type SessionUser } from '@/lib/session'
import { hasPermission, canAccess, type Permission } from '@/lib/rbac'

export type { SessionUser }

/**
 * Get current session user from server-side session.
 * Verifies HMAC signature → looks up session in DB → returns fresh user data.
 * Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
    const user = await getSessionFromCookies()
    if (!user) throw new Error('Unauthorized — vui lòng đăng nhập')
    return user
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
