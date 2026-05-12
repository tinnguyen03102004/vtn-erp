import { getPayrollPeriod } from '@/lib/actions/payroll'
import { PayrollDetail } from '@/components/PayrollDetail'
import { notFound } from 'next/navigation'


export default async function PayrollPeriodPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const period = await getPayrollPeriod(id)
    if (!period) notFound()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <PayrollDetail period={period as any} />
}
