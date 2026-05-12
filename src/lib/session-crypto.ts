/**
 * Pure crypto utilities for session management.
 * Separated from session.ts so they can be imported in Vitest
 * without pulling in `server-only` / `cookies()` / DB dependencies.
 */
import crypto from 'crypto'

const DEV_FALLBACK_SECRET = 'vtn-erp-dev-only-secret-DO-NOT-USE-IN-PROD'
const sessionGlobals = globalThis as typeof globalThis & {
    __vtnAuthSecretWarningShown?: boolean
}

export function resolveSessionSecret() {
    const secret = process.env.AUTH_SECRET?.trim()
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

    if (secret) return secret

    if (!isTestEnv && !sessionGlobals.__vtnAuthSecretWarningShown) {
        console.error('\n[CRITICAL ERROR] AUTH_SECRET not set or empty in production! Using fallback. DO NOT DO THIS IN PROD!\n')
        sessionGlobals.__vtnAuthSecretWarningShown = true
    }

    return DEV_FALLBACK_SECRET
}

const SECRET = resolveSessionSecret()

export function signToken(token: string): string {
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(token)
        .digest('hex')

    return `${token}:${signature}`
}

export function verifyAndExtractToken(cookieValue: string): string | null {
    const parts = cookieValue.split(':')
    if (parts.length !== 2) return null

    const [token, signature] = parts
    const expectedSignature = crypto
        .createHmac('sha256', SECRET)
        .update(token)
        .digest('hex')

    if (signature.length !== expectedSignature.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null
    }

    return token
}

/**
 * Quick check: is a signed cookie syntactically valid?
 * Returns true only if the HMAC signature matches.
 */
export function verifySignature(cookieValue: string): boolean {
    if (!cookieValue) return false
    return verifyAndExtractToken(cookieValue) !== null
}
