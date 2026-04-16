import { getLeadsByStage } from '@/lib/actions/crm'
import { requirePagePermission } from '@/lib/page-guard'
import CRMKanban from '@/components/CRMKanban'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
    await requirePagePermission('crm.view')

    const stages = await getLeadsByStage()
    return <CRMKanban initialStages={stages} />
}
