import { getOrder } from '@/lib/actions/sale'
import { getAttachments } from '@/lib/actions/attachments'
import { notFound } from 'next/navigation'
import SaleDetail from '@/components/SaleDetail'

export const dynamic = 'force-dynamic'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getOrder(id)
    if (!order) notFound()

    const entityType = order.docType === 'CONTRACT' ? 'contract' : 'quotation'
    const attachments = await getAttachments(entityType, id)

    return <SaleDetail order={order} initialAttachments={attachments} />
}
