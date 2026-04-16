/**
 * Server-side session management.
 *
 * Sessions live in the `app_sessions` table. The cookie only stores a
 * signed session token, so user data never leaves the server.
 *
 * NOTE: This module requires a configured Supabase client to be passed
 * via `initSessionClient()` before any session operations.
 */
import 'server-only'
import crypto from 'crypto'

const SESSION_LIFETIME_DAYS = 7
const COOKIE_NAME = 'vtn-session'
const DEV_FALLBACK_SECRET = 'vtn-erp-dev-only-secret-DO-NOT-USE-IN-PROD'
const sessionGlobals = globalThis as typeof globalThis & {
    __vtnAuthSecretWarningShown?: boolean
    __vtnSessionSupabase?: SupabaseLike
}

export type SessionUser = {
    id: string
    name: string
    email: string
    role: string
}

/** Minimal Supabase client interface needed for session operations */
interface SupabaseLike {
    from(table: string): {
        insert(data: Record<string, unknown>): Promise<{ error: { message: string } | null }>
        select(columns: string): {
            eq(column: string, value: string): {
                single(): Promise<{ data: Record<string, unknown> | null; error: unknown }>
            }
        }
        delete(): {
            eq(column: string, value: string): Promise<void>
        }
        update(data: Record<string, unknown>): {
            eq(column: string, value: string): {
                then(cb: () => undefined): void
            }
        }
    }
}

/**
 * Initialize the session module with a Supabase client.
 * Must be called before any session operations.
 */
export function initSessionClient(client: SupabaseLike) {
    sessionGlobals.__vtnSessionSupabase = client
}

function getClient(): SupabaseLike {
    if (!sessionGlobals.__vtnSessionSupabase) {
        throw new Error('@vtn/auth: Session client not initialized. Call initSessionClient() first.')
    }
    return sessionGlobals.__vtnSessionSupabase
}

function resolveSessionSecret() {
    const secret = process.env.AUTH_SECRET?.trim()
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

    if (secret) return secret

    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: AUTH_SECRET environment variable is required in production')
    }

    if (!isTestEnv && !sessionGlobals.__vtnAuthSecretWarningShown) {
        console.warn('\nAUTH_SECRET not set - using dev-only fallback. DO NOT deploy to production!\n')
        sessionGlobals.__vtnAuthSecretWarningShown = true
    }

    return DEV_FALLBACK_SECRET
}

const SECRET = resolveSessionSecret()

function signToken(token: string): string {
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(token)
        .digest('hex')

    return `${token}:${signature}`
}

function verifyAndExtractToken(cookieValue: string): string | null {
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

export async function createSession(
    userId: string,
    meta?: { userAgent?: string | null; ipAddress?: string | null }
): Promise<{ cookieValue: string; expiresAt: Date }> {
    const client = getClient()
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000)

    const { error } = await client.from('app_sessions').insert({
        token,
        userId,
        userAgent: meta?.userAgent || null,
        ipAddress: meta?.ipAddress || null,
        expiresAt: expiresAt.toISOString(),
    })

    if (error) throw new Error(`Failed to create session: ${error.message}`)

    return { cookieValue: signToken(token), expiresAt }
}

export async function getSessionFromRequest(
    getCookie: (name: string) => string | undefined
): Promise<SessionUser | null> {
    const cookieValue = getCookie(COOKIE_NAME)
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
}

export async function getSessionFromCookies(
    getCookie: (name: string) => string | undefined
): Promise<SessionUser | null> {
    const cookieValue = getCookie(COOKIE_NAME)
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
}

async function getSessionByToken(token: string): Promise<SessionUser | null> {
    const client = getClient()
    const { data: session, error } = await client
        .from('app_sessions')
        .select('userId, expiresAt')
        .eq('token', token)
        .single()

    if (error || !session) return null

    if (new Date(session.expiresAt as string) < new Date()) {
        await client.from('app_sessions').delete().eq('token', token)
        return null
    }

    const { data: user, error: userError } = await client
        .from('users')
        .select('id, name, email, role, isActive')
        .eq('id', session.userId as string)
        .single()

    if (userError || !user || !user.isActive) return null

    void client
        .from('app_sessions')
        .update({ lastActiveAt: new Date().toISOString() })
        .eq('token', token)
        .then(() => undefined)

    return {
        id: user.id as string,
        name: (user.name as string) || '',
        email: user.email as string,
        role: user.role as string,
    }
}

export async function deleteSession(cookieValue: string): Promise<void> {
    const token = verifyAndExtractToken(cookieValue)
    if (token) {
        await getClient().from('app_sessions').delete().eq('token', token)
    }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
    await getClient().from('app_sessions').delete().eq('userId', userId)
}

export function verifySignature(cookieValue: string): boolean {
    return verifyAndExtractToken(cookieValue) !== null
}

export function getSessionCookieOptions(expiresAt: Date) {
    return {
        name: COOKIE_NAME,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        expires: expiresAt,
    }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
