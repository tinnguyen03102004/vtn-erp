import { getProject } from '@/lib/actions/projects'
import { notFound } from 'next/navigation'
import ProjectDetail from '@/components/ProjectDetail'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const project = await getProject(id)
    if (!project) notFound()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <ProjectDetail project={project as any} />
}
