import { getTimesheets } from '@/lib/actions/timesheets'
import { getProjects } from '@/lib/actions/projects'
import { getCurrentEmployee } from '@/lib/actions/employees'
import { requirePagePermission } from '@/lib/page-guard'
import TimesheetGrid from './grid'

export const dynamic = 'force-dynamic'

export default async function TimesheetPage() {
    await requirePagePermission('project.view')

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const [currentEmployee, allProjects] = await Promise.all([
        getCurrentEmployee(),
        getProjects(),
    ])
    const currentEmployeeId = currentEmployee?.id
    const timesheets = currentEmployeeId ? await getTimesheets({
        employeeId: currentEmployeeId,
        startDate: monday.toISOString().split('T')[0],
        endDate: saturday.toISOString().split('T')[0],
    }) : []

    const weekDates: string[] = []
    for (let i = 0; i < 6; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDates.push(d.toISOString().split('T')[0])
    }

    const activeProjects = allProjects
        .filter(p => p.state === 'ACTIVE' || p.state === 'DRAFT')
        .map(p => ({ id: p.id, name: p.name, code: p.code }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedTimesheets = timesheets.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        projectName: t.project?.name ?? '',
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
        />
    )
}
