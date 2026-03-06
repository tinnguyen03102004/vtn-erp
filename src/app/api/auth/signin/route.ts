import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ ok: false, error: 'Vui lòng nhập email và mật khẩu' }, { status: 400 })
        }

        // Query user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, password, name, role, isActive')
            .eq('email', email as string)
            .single()

        if (error || !user || !user.password) {
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

        // Create response with session cookie
        const response = NextResponse.json({
            ok: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })

        // Set session cookie
        const sessionData = JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role })
        response.cookies.set('vtn-session', Buffer.from(sessionData).toString('base64'), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ ok: false, error: 'Lỗi server' }, { status: 500 })
    }
}
