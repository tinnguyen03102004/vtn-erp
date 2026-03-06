import { getInvoice } from '@/lib/actions/finance'
import { notFound } from 'next/navigation'
import InvoiceDetail from '@/components/InvoiceDetail'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const invoice = await getInvoice(id)
    if (!invoice) notFound()

    return <InvoiceDetail invoice={invoice} />
}
