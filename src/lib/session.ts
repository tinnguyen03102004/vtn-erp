import 'server-only'
/**
 * Server-side session management.
 *
 * Sessions live in the `app_sessions` table. The cookie only stores a
 * signed session token, so user data never leaves the server.
 *
 * Pure crypto functions (signToken, verifyAndExtractToken, verifySignature)
 * are in session-crypto.ts so they can be tested without server-only.
 */

import crypto from 'crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { signToken, verifyAndExtractToken, verifySignature } from '@/lib/session-crypto'

const SESSION_LIFETIME_DAYS = 7
const COOKIE_NAME = 'vtn-session'

export type SessionUser = {
    id: string
    name: string
    email: string
    role: string
}

// Re-export crypto functions so existing imports continue to work
export { signToken, verifyAndExtractToken, verifySignature }

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

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    const cookieValue = req.cookies.get(COOKIE_NAME)?.value
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
}

// Wrapped in React cache() to deduplicate DB lookups within the same request.
// When layout.tsx and page.tsx both call this, only 1 DB round trip happens.
export const getSessionFromCookies = cache(async (): Promise<SessionUser | null> => {
    const cookieStore = await cookies()
    const cookieValue = cookieStore.get(COOKIE_NAME)?.value
    if (!cookieValue) return null

    const token = verifyAndExtractToken(cookieValue)
    if (!token) return null

    return getSessionByToken(token)
})

// ─── In-memory session cache (Phase 2 perf optimization) ──────────────────
// Avoids 2 DB round-trips per request for session verification.
// TTL: 60s, Max entries: 100, Invalidated on logout/delete.
const SESSION_CACHE_TTL_MS = 60_000
const SESSION_CACHE_MAX_SIZE = 100
const sessionCache = new Map<string, { user: SessionUser; expiresAt: number }>()

function getCachedSession(token: string): SessionUser | null {
    const cached = sessionCache.get(token)
    if (!cached) return null
    if (Date.now() > cached.expiresAt) {
        sessionCache.delete(token)
        return null
    }
    return cached.user
}

function setCachedSession(token: string, user: SessionUser): void {
    // Simple LRU: evict oldest entries when at capacity
    if (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
        const firstKey = sessionCache.keys().next().value
        if (firstKey) sessionCache.delete(firstKey)
    }
    sessionCache.set(token, { user, expiresAt: Date.now() + SESSION_CACHE_TTL_MS })
}

/** Invalidate cache for a specific token (called on logout) */
export function invalidateSessionCache(token?: string): void {
    if (token) {
        sessionCache.delete(token)
    } else {
        sessionCache.clear()
    }
}

async function getSessionByToken(token: string): Promise<SessionUser | null> {
    // Check in-memory cache first (saves ~300ms on cache hit)
    const cached = getCachedSession(token)
    if (cached) return cached

    // Step 1: Fetch session
    const { data: session, error } = await supabase
        .from('app_sessions')
        .select('userId, expiresAt')
        .eq('token', token)
        .single()

    if (error || !session) return null

    if (new Date(session.expiresAt) < new Date()) {
        void supabase.from('app_sessions').delete().eq('token', token)
        return null
    }

    // Step 2: Fetch user + update lastActiveAt in parallel (saves ~250ms)
    const [userResult] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, role, isActive')
            .eq('id', session.userId)
            .single(),
        // Fire-and-forget: update last active timestamp
        supabase
            .from('app_sessions')
            .update({ lastActiveAt: new Date().toISOString() })
            .eq('token', token),
    ])

    const { data: user, error: userError } = userResult
    if (userError || !user || !user.isActive) return null

    const sessionUser: SessionUser = {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role,
    }

    // Cache the resolved user for subsequent requests
    setCachedSession(token, sessionUser)

    return sessionUser
}

export async function deleteSession(cookieValue: string): Promise<void> {
    const token = verifyAndExtractToken(cookieValue)
    if (token) {
        invalidateSessionCache(token)
        await supabase.from('app_sessions').delete().eq('token', token)
    }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
    invalidateSessionCache() // Clear entire cache since we don't track tokens by userId
    await supabase.from('app_sessions').delete().eq('userId', userId)
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
