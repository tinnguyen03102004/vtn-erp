import { redirect } from 'next/navigation'
import { getSessionFromCookies } from '@/lib/session'
import DashboardShell from '@/components/shared/DashboardShell'

// Force all dashboard serverless functions to run in Singapore
// (same region as Supabase DB) to minimize cross-region latency.
export const preferredRegion = 'sin1'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionFromCookies()
    if (!user) redirect('/login')

    return <DashboardShell user={user}>{children}</DashboardShell>
}
