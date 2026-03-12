import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { createSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/session'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ ok: false, error: 'Vui lÃ²ng nháº­p email vÃ  máº­t kháº©u' }, { status: 400 })
        }

        // Query user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, password, name, role, isActive')
            .eq('email', email as string)
            .single()

        if (error || !user || !user.password) {
            return NextResponse.json({ ok: false, error: 'Email khÃ´ng tá»n táº¡i' }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ ok: false, error: 'TÃ i khoáº£n ÄÃ£ bá» khÃ³a' }, { status: 401 })
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password as string, user.password)
        if (!isValid) {
            return NextResponse.json({ ok: false, error: 'Máº­t kháº©u khÃ´ng ÄÃºng' }, { status: 401 })
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
        return NextResponse.json({ ok: false, error: 'Lá»-i server' }, { status: 500 })
    }
}
