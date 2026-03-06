import { getLead } from '@/lib/actions/crm'
import { notFound } from 'next/navigation'
import LeadDetail from '@/components/LeadDetail'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const lead = await getLead(id)
    if (!lead) notFound()

    return <LeadDetail lead={lead} />
}
