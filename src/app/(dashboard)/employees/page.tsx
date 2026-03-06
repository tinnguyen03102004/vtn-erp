import { getEmployees } from '@/lib/actions/employees'
import EmployeesGrid from '@/components/EmployeesGrid'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
    const employees = await getEmployees()
    return <EmployeesGrid initialEmployees={employees} />
}
