import { getSessionFromCookies } from './session'
import type { SessionUser } from './session'
import { hasPermission, canAccess, type Permission } from './rbac'

/**
 * Get current session user from server-side session.
 * Verifies HMAC signature → looks up session in DB → returns fresh user data.
 * Throws if not authenticated.
 *
 * @param getCookie - Function to retrieve cookie value by name
 */
export async function requireAuth(
    getCookie: (name: string) => string | undefined
): Promise<SessionUser> {
    const user = await getSessionFromCookies(getCookie)
    if (!user) throw new Error('Unauthorized — vui lòng đăng nhập')
    return user
}

/**
 * Check permission. Throws if user lacks it.
 */
export async function requirePermission(
    getCookie: (name: string) => string | undefined,
    permission: Permission,
) {
    const user = await requireAuth(getCookie)
    if (!hasPermission(user.role, permission)) {
        throw new Error(`Forbidden — Bạn không có quyền "${permission}"`)
    }
    return user
}

/**
 * Check module access. Throws if user lacks it.
 */
export async function requireModuleAccess(
    getCookie: (name: string) => string | undefined,
    module: string,
) {
    const user = await requireAuth(getCookie)
    if (!canAccess(user.role, module)) {
        throw new Error(`Forbidden — Bạn không có quyền truy cập module "${module}"`)
    }
    return user
}
