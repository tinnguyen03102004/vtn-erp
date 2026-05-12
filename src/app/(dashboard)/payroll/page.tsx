import { getPayrollPeriods } from '@/lib/actions/payroll'
import { PayrollPage } from '@/components/PayrollPage'


export default async function Payroll() {
    const periods = await getPayrollPeriods()
    return <PayrollPage periods={periods} />
}
