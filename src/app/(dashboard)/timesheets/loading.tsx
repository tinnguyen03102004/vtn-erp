export default function TimesheetLoading() {
    return (
        <div className="loading-skeleton animate-fade-in">
            <div className="page-header">
                <div className="page-header-left">
                    <div className="skeleton skeleton-header" style={{ width: 180 }} />
                    <div className="skeleton skeleton-line w-60" style={{ height: 14, width: 280 }} />
                </div>
                <div className="page-actions">
                    <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 8 }} />
                    <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 8 }} />
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 20 }} />
                <div className="skeleton" style={{ width: 90, height: 18, borderRadius: 4 }} />
            </div>
            <div className="grid-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="kpi-card" style={{ opacity: 0.7 }}>
                        <div className="skeleton" style={{ width: 100, height: 12, marginBottom: 12, borderRadius: 4 }} />
                        <div className="skeleton" style={{ width: 60, height: 28, marginBottom: 12, borderRadius: 4 }} />
                        <div className="skeleton" style={{ width: 140, height: 10, borderRadius: 4 }} />
                    </div>
                ))}
            </div>
            <div className="card">
                <div className="card-header">
                    <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 20 }} />
                </div>
                <div className="card-body">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-row" style={{ marginBottom: 8 }}>
                            <div className="skeleton" style={{ flex: 2, height: 40, borderRadius: 6 }} />
                            {[1, 2, 3, 4, 5, 6].map(j => (
                                <div key={j} className="skeleton" style={{ flex: 1, height: 40, borderRadius: 6 }} />
                            ))}
                            <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 6 }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
