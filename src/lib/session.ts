/**
 * Server-Side Session Management (Odoo-style)
 * 
 * Sessions are stored in the `app_sessions` table in PostgreSQL.
 * Cookie only contains a signed session token (HMAC-SHA256).
 * User data never leaves the server.
 */

import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'
import crypto from 'crypto'

// ── Config ──
const SESSION_LIFETIME_DAYS = 7
const COOKIE_NAME = 'vtn-session'
const SECRET = process.env.AUTH_SECRET || 'vtn-erp-default-secret'

export type SessionUser = {
    id: string
    name: string
    email: string
    role: string
}

// ── HMAC Signing ──
// Cookie value = token:signature (ensures cookie can't be forged)

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

// ── Session CRUD ──

/**
 * Create a new session for a user. Returns the signed cookie value.
 */
export async function createSession(
    userId: string,
    req?: NextRequest
): Promise<{ cookieValue: string; expiresAt: Date }> {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('app_sessions').insert({
        token,
        userId,
        userAgent: req?.headers.get('user-agent') || null,
        ipAddress: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req?.headers.get('x-real-ip')
            || null,
        expiresAt: expiresAt.toISOString(),
    })

    if (error) throw new Error(`Failed to create session: ${error.message}`)

    return { cookieValue: signToken(token), expiresAt }
}

/**
 * Get the current session user from a signed cookie.
 * Looks up the session in DB and returns the user with fresh role data.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    const cookieValue = req.cookies.get(COOKIE_NAME)?.value
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
}

/**
 * Get session user from server action context (uses next/headers cookies).
 */
export async function getSessionFromCookies(): Promise<SessionUser | null> {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(COOKIE_NAME)?.value
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
}

/**
 * Lookup session by token, verify expiry, return user.
 */
async function getSessionByToken(token: string): Promise<SessionUser | null> {
    // Lookup session + join user in one query
    const { data: session, error } = await supabase
        .from('app_sessions')
        .select('userId, expiresAt')
        .eq('token', token)
        .single()

    if (error || !session) return null

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
        // Clean up expired session
        await supabase.from('app_sessions').delete().eq('token', token)
        return null
    }

    // Get fresh user data (role might have changed)
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, isActive')
        .eq('id', session.userId)
        .single()

    if (userError || !user || !user.isActive) return null

    // Update lastActiveAt (fire-and-forget)
    supabase
        .from('app_sessions')
        .update({ lastActiveAt: new Date().toISOString() })
        .eq('token', token)
        .then(() => { /* ignore */ })

    return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role,
    }
}

/**
 * Delete a session by token (logout).
 */
export async function deleteSession(cookieValue: string): Promise<void> {
    const token = verifyAndExtractToken(cookieValue)
    if (token) {
        await supabase.from('app_sessions').delete().eq('token', token)
    }
}

/**
 * Delete all sessions for a user (force logout everywhere).
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
    await supabase.from('app_sessions').delete().eq('userId', userId)
}

/**
 * Quick verify: check if a cookie has a valid HMAC signature.
 * Does NOT check DB (for use in middleware where speed matters).
 */
export function verifySignature(cookieValue: string): boolean {
    return verifyAndExtractToken(cookieValue) !== null
}

/**
 * Cookie configuration for setting the session cookie.
 */
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
