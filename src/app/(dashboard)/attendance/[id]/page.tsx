import { getAttendancePeriod } from '@/lib/actions/attendance'
import { requirePagePermission } from '@/lib/page-guard'
import { notFound } from 'next/navigation'
import PeriodDetail from './detail'

export default async function AttendancePeriodPage({ params }: { params: Promise<{ id: string }> }) {
    await requirePagePermission('hr.view')
    const { id } = await params
    const data = await getAttendancePeriod(id)

    if (!data) return notFound()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <PeriodDetail period={data.period as any} employees={data.employees as any} records={data.records as any} />
}
