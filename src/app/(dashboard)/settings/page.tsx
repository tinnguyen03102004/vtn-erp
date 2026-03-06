import { getSettings } from '@/lib/actions/settings'
import { getUsers } from '@/lib/actions/users'
import SettingsContent from '@/components/SettingsContent'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const [settings, users] = await Promise.all([
        getSettings(),
        getUsers(),
    ])

    return <SettingsContent initialSettings={settings} initialUsers={users} />
}
