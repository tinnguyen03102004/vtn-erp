// import { formatCurrency, formatDate } from '@/lib/utils'
import { getQuotations, getContracts } from '@/lib/actions/sale'
import { requirePagePermission } from '@/lib/page-guard'
import { hasPermission } from '@/lib/rbac'
import SalePageTabs from '@/components/SalePageTabs'


export default async function SalePage() {
    const user = await requirePagePermission('sale.view')
    const canCreateQuotation = hasPermission(user.role, 'sale.edit')

    const [quotations, contracts] = await Promise.all([getQuotations(), getContracts()])

    return <SalePageTabs quotations={quotations} contracts={contracts} canCreateQuotation={canCreateQuotation} />
}
