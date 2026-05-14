import { getProjectCostAllocation } from '@/lib/actions/project-costs'
import { requirePagePermission } from '@/lib/page-guard'
import CostAllocationView from './view'

export default async function ProjectCostsPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>
}) {
    await requirePagePermission('finance.view')

    const params = await searchParams
    const year = params.year ? parseInt(params.year) : undefined
    const month = params.month ? parseInt(params.month) : undefined

    const data = await getProjectCostAllocation(year, month)

    return <CostAllocationView data={data} />
}
