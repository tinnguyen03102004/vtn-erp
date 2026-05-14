import { getTimesheets } from '@/lib/actions/timesheets'
import { getActiveProjectOptions } from '@/lib/actions/projects'
import { getCurrentEmployee } from '@/lib/actions/employees'
import { requirePagePermission } from '@/lib/page-guard'
import { getSessionFromCookies } from '@/lib/session'
import TimesheetGrid from './grid'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

export default async function TimesheetPage() {
    await requirePagePermission('project.view')
    const user = await getSessionFromCookies()
    const isManager = user ? MANAGER_ROLES.includes(user.role) : false

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const [currentEmployee, activeProjects] = await Promise.all([
        getCurrentEmployee(),
        getActiveProjectOptions(),
    ])
    const currentEmployeeId = currentEmployee?.id

    // Managers see all timesheets; regular employees only see their own
    const timesheetFilters: { employeeId?: string; startDate?: string; endDate?: string } = {
        startDate: monday.toISOString().split('T')[0],
        endDate: saturday.toISOString().split('T')[0],
    }
    if (!isManager && currentEmployeeId) {
        timesheetFilters.employeeId = currentEmployeeId
    }
    const timesheets = (currentEmployeeId || isManager) ? await getTimesheets(timesheetFilters) : []

    const weekDates: string[] = []
    for (let i = 0; i < 6; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDates.push(d.toISOString().split('T')[0])
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedTimesheets = timesheets.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        projectName: t.project?.name ?? '',
        employeeName: t.employeeName ?? '',
        employeeId: t.employeeId ?? '',
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
        hours: t.hours,
        description: t.description,
    }))

    return (
        <TimesheetGrid
            weekDates={weekDates}
            monday={monday.toISOString().split('T')[0]}
            timesheets={serializedTimesheets}
            projects={activeProjects}
            employeeId={currentEmployeeId}
            isManager={isManager}
        />
    )
}
