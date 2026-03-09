import { NextRequest, NextResponse } from 'next/server'
import { verifySignature, SESSION_COOKIE_NAME } from '@/lib/session'

export function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname

    // Public paths
    const publicPaths = ['/login', '/api/auth']
    const isPublic = publicPaths.some(p => path.startsWith(p))
    if (isPublic) return NextResponse.next()

    // Static / internal paths
    if (path.startsWith('/_next') || path.startsWith('/favicon') || path.includes('.')) {
        return NextResponse.next()
    }

    // Check session cookie exists and has valid HMAC signature
    // Note: We only verify signature here (fast), not DB lookup (that's in auth-guard)
    const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!cookieValue || !verifySignature(cookieValue)) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
