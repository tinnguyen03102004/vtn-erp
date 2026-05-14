import { NextRequest, NextResponse } from 'next/server'
import { getUserForAuth } from '@/lib/server-supabase'
import bcrypt from 'bcryptjs'
import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/session'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    // Brute-force protection: 5 login attempts per minute per IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rl = checkRateLimit(`login:${ip}`, { limit: 5, windowSeconds: 60 })
    if (!rl.allowed) return rateLimitResponse(rl)
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ ok: false, error: 'Vui lòng nhập email và mật khẩu' }, { status: 400 })
        }

        // Query user via dedicated auth lookup (bypasses deny-list)
        const user = await getUserForAuth(email as string)

        if (!user || !user.password) {
            return NextResponse.json({ ok: false, error: 'Email không tồn tại' }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ ok: false, error: 'Tài khoản đã bị khóa' }, { status: 401 })
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password as string, user.password)
        if (!isValid) {
            return NextResponse.json({ ok: false, error: 'Mật khẩu không đúng' }, { status: 401 })
        }

        // Create server-side session
        const { cookieValue, expiresAt } = await createSession(user.id, req)

        // Create response
        const response = NextResponse.json({
            ok: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })

        // Set signed session cookie
        response.cookies.set(SESSION_COOKIE_NAME, cookieValue, getSessionCookieOptions(expiresAt))

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ ok: false, error: 'Lỗi server' }, { status: 500 })
    }
}
