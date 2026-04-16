import { redirect } from 'next/navigation'
import { getSessionFromCookies } from '@/lib/session'
import { hasPermission } from '@/lib/rbac'
import { getSettings } from '@/lib/actions/settings'
import { getUsers } from '@/lib/actions/users'
import SettingsContent from '@/components/SettingsContent'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const user = await getSessionFromCookies()
    if (!user) redirect('/login')

    const canManageUsers = hasPermission(user.role, 'users.manage')
    const settings = await getSettings()
    const users = canManageUsers ? await getUsers() : []

    return <SettingsContent initialSettings={settings} initialUsers={users} canManageUsers={canManageUsers} />
}
