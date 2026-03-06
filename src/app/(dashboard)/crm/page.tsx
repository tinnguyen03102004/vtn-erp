import { getLeadsByStage } from '@/lib/actions/crm'
import CRMKanban from '@/components/CRMKanban'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
    const stages = await getLeadsByStage()
    return <CRMKanban initialStages={stages} />
}
