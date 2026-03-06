import { NextRequest, NextResponse } from 'next/server'

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

    // Check session cookie
    const session = req.cookies.get('vtn-session')?.value
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
