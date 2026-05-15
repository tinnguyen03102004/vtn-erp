import { getTimesheets, getTimesheetOverview, getApprovalSummary } from '@/lib/actions/timesheets'
import { getActiveProjectOptions } from '@/lib/actions/projects'
import { getCurrentEmployee } from '@/lib/actions/employees'
import { requirePagePermission } from '@/lib/page-guard'
import { getSessionFromCookies } from '@/lib/session'
import TimesheetView from './grid'
import TimesheetOverview from '@/components/TimesheetOverview'

const MANAGER_ROLES = ['DIRECTOR', 'ADMIN', 'PROJECT_MANAGER']

function getWeekRange(weekParam?: string) {
    const today = weekParam ? new Date(weekParam + 'T00:00:00Z') : new Date()
    const dayOfWeek = today.getUTCDay()
    const monday = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    ))
    const saturday = new Date(Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + 5
    ))

    const prevMonday = new Date(Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() - 7
    ))
    const nextMonday = new Date(Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + 7
    ))

    return { monday, saturday, prevMonday, nextMonday }
}

const formatDate = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

export default async function TimesheetPage({
    searchParams,
}: {
    searchParams: Promise<{ week?: string; view?: string; year?: string; month?: string }>
}) {
    await requirePagePermission('project.view')
    const user = await getSessionFromCookies()
    const isManager = user ? MANAGER_ROLES.includes(user.role) : false
    const params = await searchParams

    // ── Route: Overview (Director/PM default) ──
    const viewMode = params.view || (isManager ? 'overview' : 'week')

    if (viewMode === 'overview' && isManager) {
        const now = new Date()
        const year = params.year ? Number(params.year) : now.getFullYear()
        const month = params.month ? Number(params.month) : now.getMonth() + 1

        const [data, approvalData] = await Promise.all([
            getTimesheetOverview(year, month),
            getApprovalSummary(year, month),
        ])

        // Build available months for navigation (current year ± 1)
        const availableMonths: { year: number; month: number }[] = []
        for (let y = year - 1; y <= year + 1; y++) {
            for (let m = 1; m <= 12; m++) {
                availableMonths.push({ year: y, month: m })
            }
        }

        return <TimesheetOverview data={data} availableMonths={availableMonths} approvalData={approvalData} />
    }

    // ── Route: Weekly Grid (NV default, or manager switches) ──
    const { monday, saturday, prevMonday, nextMonday } = getWeekRange(params.week)

    const [currentEmployee, activeProjects] = await Promise.all([
        getCurrentEmployee(),
        getActiveProjectOptions(),
    ])
    const currentEmployeeId = currentEmployee?.id

    const timesheetFilters: { employeeId?: string; startDate?: string; endDate?: string } = {
        startDate: formatDate(monday),
        endDate: formatDate(saturday),
    }
    if (!isManager && currentEmployeeId) {
        timesheetFilters.employeeId = currentEmployeeId
    }
    const timesheets = (currentEmployeeId || isManager) ? await getTimesheets(timesheetFilters) : []

    const weekDates: string[] = []
    for (let i = 0; i < 6; i++) {
        const d = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i))
        weekDates.push(formatDate(d))
    }

    // Determine if this is the current week
    const now = new Date()
    const currentDow = now.getUTCDay()
    const currentMonday = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(),
        now.getUTCDate() - (currentDow === 0 ? 6 : currentDow - 1)
    ))
    const isCurrentWeek = formatDate(monday) === formatDate(currentMonday)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedTimesheets = timesheets.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        projectName: t.project?.name ?? '',
        employeeName: t.employeeName ?? '',
        employeeId: t.employeeId ?? '',
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date).split('T')[0],
        hours: t.hours,
        description: t.description,
    }))

    // Compute stats
    const uniqueEmployees = new Set(serializedTimesheets.map(t => t.employeeId))
    const totalHoursAll = serializedTimesheets.reduce((s, t) => s + t.hours, 0)
    const uniqueProjects = new Set(serializedTimesheets.map(t => t.projectId))
    const daysWithEntries = new Set(serializedTimesheets.map(t => t.date))

    const myTimesheets = currentEmployeeId
        ? serializedTimesheets.filter(t => t.employeeId === currentEmployeeId)
        : []
    const myTotalHours = myTimesheets.reduce((s, t) => s + t.hours, 0)
    const myProjects = new Set(myTimesheets.map(t => t.projectId))
    const myDays = new Set(myTimesheets.map(t => t.date))

    // Find employees below target (40h)
    const employeeHoursMap = new Map<string, number>()
    for (const t of serializedTimesheets) {
        employeeHoursMap.set(t.employeeId, (employeeHoursMap.get(t.employeeId) || 0) + t.hours)
    }
    const belowTarget = Array.from(employeeHoursMap.values()).filter(h => h < 40).length

    return (
        <TimesheetView
            weekDates={weekDates}
            timesheets={serializedTimesheets}
            projects={activeProjects}
            employeeId={currentEmployeeId}
            isManager={isManager}
            prevWeek={formatDate(prevMonday)}
            nextWeek={formatDate(nextMonday)}
            isCurrentWeek={isCurrentWeek}
            stats={{
                totalEmployees: uniqueEmployees.size,
                totalHoursAll,
                totalProjects: uniqueProjects.size,
                totalDays: daysWithEntries.size,
                myTotalHours,
                myProjects: myProjects.size,
                myDays: myDays.size,
                avgHoursPerEmployee: uniqueEmployees.size > 0 ? Math.round(totalHoursAll / uniqueEmployees.size * 10) / 10 : 0,
                belowTarget,
            }}
        />
    )
}

