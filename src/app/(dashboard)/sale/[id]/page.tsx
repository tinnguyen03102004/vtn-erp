import { getOrder } from '@/lib/actions/sale'
import { getAttachments } from '@/lib/actions/attachments'
import { requirePagePermission } from '@/lib/page-guard'
import { hasPermission } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import SaleDetail from '@/components/sale/SaleDetail'


export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requirePagePermission('sale.view')
    const canEditSale = hasPermission(user.role, 'sale.edit')
    const canApproveSale = hasPermission(user.role, 'sale.approve')
    const canCreateProject = hasPermission(user.role, 'project.edit')

    const { id } = await params
    const order = await getOrder(id)
    if (!order) notFound()

    const attachments = await getAttachments('sale_order', id)

    return (
        <SaleDetail
            order={order}
            initialAttachments={attachments}
            canEditSale={canEditSale}
            canApproveSale={canApproveSale}
            canCreateProject={canCreateProject}
        />
    )
}
