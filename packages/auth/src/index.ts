// ================================================================
// @vtn/auth — Authentication & Authorization
// ================================================================

// Session
export type { SessionUser } from './session'
export {
    createSession,
    getSessionFromRequest,
    getSessionFromCookies,
    deleteSession,
    deleteAllUserSessions,
    verifySignature,
    getSessionCookieOptions,
    SESSION_COOKIE_NAME,
} from './session'

// RBAC
export type { Permission } from './rbac'
export { hasPermission, getPermissions, canAccess } from './rbac'

// Guards
export { requireAuth, requirePermission, requireModuleAccess } from './guard'
