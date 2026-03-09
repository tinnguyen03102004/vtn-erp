import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
    const user = await getSessionFromRequest(req)
    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 })
    }
    return NextResponse.json({ user })
}
