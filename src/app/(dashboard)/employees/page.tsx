import { getEmployees } from '@/lib/actions/employees'
import { requirePagePermission } from '@/lib/page-guard'
import { hasPermission } from '@/lib/rbac'
import EmployeesGrid from '@/components/EmployeesGrid'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
    const user = await requirePagePermission('hr.view')
    const canManageEmployees = hasPermission(user.role, 'hr.edit')

    const employees = await getEmployees()
    return <EmployeesGrid initialEmployees={employees} canManageEmployees={canManageEmployees} />
}
