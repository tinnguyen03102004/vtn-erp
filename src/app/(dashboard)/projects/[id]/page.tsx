import { getProject } from '@/lib/actions/projects'
import { requirePagePermission } from '@/lib/page-guard'
import { hasPermission } from '@/lib/rbac'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/components/ProjectDetail'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const user = await requirePagePermission('project.view')
    const canEditProject = hasPermission(user.role, 'project.edit')

    const { id } = await params
    const project = await getProject(id)
    if (!project) notFound()

    return <ProjectDetail project={project} canEditProject={canEditProject} />
}
