import { requirePagePermission } from '@/lib/page-guard'
import { getSessionFromCookies } from '@/lib/session'
import { getCurrentEmployee } from '@/lib/actions/employees'
import { getLeaveRequests, getLeaveBalances, getLeaveTypes, getLeaveOverview } from '@/lib/actions/leave'
import LeaveManagement from '@/components/LeaveManagement'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

export default async function LeavePage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string }>
}) {
    await requirePagePermission('project.view')
    const user = await getSessionFromCookies()
    const isManager = user ? MANAGER_ROLES.includes(user.role) : false
    const params = await searchParams
    const year = params.year ? Number(params.year) : new Date().getFullYear()

    const currentEmployee = await getCurrentEmployee()
    const currentEmployeeId = currentEmployee?.id || null

    const [requests, balances, leaveTypes, overview] = await Promise.all([
        getLeaveRequests({ year }),
        currentEmployeeId ? getLeaveBalances(currentEmployeeId, year) : Promise.resolve([]),
        getLeaveTypes(),
        isManager ? getLeaveOverview(year) : Promise.resolve([]),
    ])

    return (
        <LeaveManagement
            requests={requests}
            balances={balances}
            leaveTypes={leaveTypes}
            isManager={isManager}
            currentEmployeeId={currentEmployeeId}
            year={year}
            overview={isManager ? overview : undefined}
        />
    )
}
