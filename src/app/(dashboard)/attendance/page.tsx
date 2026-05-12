import { getAttendancePeriods } from '@/lib/actions/attendance'
import { requirePagePermission } from '@/lib/page-guard'
import AttendanceList from './list'

export default async function AttendancePage() {
    await requirePagePermission('hr.view')
    const periods = await getAttendancePeriods()

    return <AttendanceList periods={periods} />
}
