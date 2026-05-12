import { getLead } from '@/lib/actions/crm'
import { requirePagePermission } from '@/lib/page-guard'
import { notFound } from 'next/navigation'
import LeadDetail from '@/components/LeadDetail'


export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await requirePagePermission('crm.view')

    const { id } = await params
    const lead = await getLead(id)
    if (!lead) notFound()

    return <LeadDetail lead={lead} />
}
