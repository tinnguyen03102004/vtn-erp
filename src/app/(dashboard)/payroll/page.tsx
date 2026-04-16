import { getPayrollPeriods } from '@/lib/actions/payroll'
import { PayrollPage } from '@/components/PayrollPage'

export const dynamic = 'force-dynamic'

export default async function Payroll() {
    const periods = await getPayrollPeriods()
    return <PayrollPage periods={periods} />
}
