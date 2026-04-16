import { redirect } from 'next/navigation'
import { getSessionFromCookies } from '@/lib/session'
import DashboardShell from '@/components/shared/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionFromCookies()
    if (!user) redirect('/login')

    return <DashboardShell user={user}>{children}</DashboardShell>
}
