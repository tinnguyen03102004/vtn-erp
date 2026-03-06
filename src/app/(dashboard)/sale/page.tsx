import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getQuotations, getContracts } from '@/lib/actions/sale'
import SalePageTabs from '@/components/SalePageTabs'

export const dynamic = 'force-dynamic'

export default async function SalePage() {
    const [quotations, contracts] = await Promise.all([getQuotations(), getContracts()])

    return <SalePageTabs quotations={quotations} contracts={contracts} />
}
