import { getTimesheets } from '@/lib/actions/timesheets'
import { getProjects } from '@/lib/actions/projects'
import { getEmployees } from '@/lib/actions/employees'
import { requireAuth } from '@/lib/auth-guard'
import TimesheetGrid from './grid'

export const dynamic = 'force-dynamic'

export default async function TimesheetPage() {
    const user = await requireAuth()

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const [timesheets, allProjects, employees] = await Promise.all([
        getTimesheets({
            startDate: monday.toISOString().split('T')[0],
            endDate: saturday.toISOString().split('T')[0],
        }),
        getProjects(),
        getEmployees(),
    ])

    const weekDates: string[] = []
    for (let i = 0; i < 6; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDates.push(d.toISOString().split('T')[0])
    }

    const activeProjects = allProjects
        .filter(p => p.state === 'ACTIVE' || p.state === 'DRAFT')
        .map(p => ({ id: p.id, name: p.name, code: p.code }))

    const serializedTimesheets = timesheets.map((t: any) => ({
        id: t.id,
        projectId: t.projectId,
        projectName: t.project?.name ?? '',
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
        hours: t.hours,
        description: t.description,
    }))

    // Find the employee record linked to the logged-in user
    const currentEmployee = employees.find((e: any) => e.userId === user.id)
    const currentEmployeeId = currentEmployee?.id

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
