import 'server-only'
/**
 * Server-side session management.
 *
 * Sessions live in the `app_sessions` table. The cookie only stores a
 * signed session token, so user data never leaves the server.
 */

import crypto from 'crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const SESSION_LIFETIME_DAYS = 7
const COOKIE_NAME = 'vtn-session'
const DEV_FALLBACK_SECRET = 'vtn-erp-dev-only-secret-DO-NOT-USE-IN-PROD'
const sessionGlobals = globalThis as typeof globalThis & {
    __vtnAuthSecretWarningShown?: boolean
}

function resolveSessionSecret() {
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

export type SessionUser = {
    id: string
    name: string
    email: string
    role: string
}

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

async function getSessionByToken(token: string): Promise<SessionUser | null> {
    const { data: session, error } = await supabase
        .from('app_sessions')
        .select('userId, expiresAt')
        .eq('token', token)
        .single()

    if (error || !session) return null

    if (new Date(session.expiresAt) < new Date()) {
        await supabase.from('app_sessions').delete().eq('token', token)
        return null
    }

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, isActive')
        .eq('id', session.userId)
        .single()

    if (userError || !user || !user.isActive) return null

    void supabase
        .from('app_sessions')
        .update({ lastActiveAt: new Date().toISOString() })
        .eq('token', token)
        .then(() => undefined)

    return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role,
    }
}

export async function deleteSession(cookieValue: string): Promise<void> {
    const token = verifyAndExtractToken(cookieValue)
    if (token) {
        await supabase.from('app_sessions').delete().eq('token', token)
    }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
    await supabase.from('app_sessions').delete().eq('userId', userId)
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
