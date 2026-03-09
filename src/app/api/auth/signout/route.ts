import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, SESSION_COOKIE_NAME } from '@/lib/session'

export async function POST(req: NextRequest) {
    // Delete session from DB
    const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value
    if (cookieValue) {
        await deleteSession(cookieValue)
    }

    // Clear cookie and redirect
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
}
