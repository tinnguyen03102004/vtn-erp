import { getAuditLogs, getAuditFilters } from '@/lib/actions/audit'
import AuditLogViewer from './viewer'

export default async function AuditPage() {
    const [logsResult, filtersResult] = await Promise.all([
        getAuditLogs({ page: 1, limit: 50 }),
        getAuditFilters(),
    ])

    const logs = logsResult.success ? logsResult.data.logs : []
    const total = logsResult.success ? logsResult.data.total : 0
    const filters = filtersResult.success ? filtersResult.data : { actions: [], entities: [] }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Nhật ký hoạt động</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                    Theo dõi tất cả thao tác trong hệ thống
                </p>
            </div>

            <AuditLogViewer
                initialLogs={logs}
                initialTotal={total}
                availableActions={filters.actions}
                availableEntities={filters.entities}
            />
        </div>
    )
}
