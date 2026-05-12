import { getMyAttendance, getAttendancePeriodOptions } from '@/lib/actions/attendance'
import { requireAuth } from '@/lib/auth-guard'
import MyAttendanceView from './view'

export default async function MyAttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ periodId?: string }>
}) {
    await requireAuth()
    const { periodId } = await searchParams

    const [data, periods] = await Promise.all([
        getMyAttendance(periodId),
        getAttendancePeriodOptions(),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <MyAttendanceView data={data as any} periods={periods as any} currentPeriodId={periodId} />
}
