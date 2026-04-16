import { redirect } from 'next/navigation'
import { requirePagePermission } from '@/lib/page-guard'

export default async function FinancePage() {
    await requirePagePermission('finance.view')

    redirect('/finance/invoices')
}
