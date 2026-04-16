import { redirect } from 'next/navigation'
import { getSessionFromCookies } from '@/lib/session'
import { hasPermission, type Permission } from '@/lib/rbac'

export async function requirePagePermission(permission: Permission) {
    const user = await getSessionFromCookies()

    if (!user) {
        redirect('/login')
    }

    if (!hasPermission(user.role, permission)) {
        redirect('/dashboard')
    }

    return user
}
