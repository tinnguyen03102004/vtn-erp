export default function PayrollLoading() {
    return (
        <div className="loading-skeleton animate-fade-in">
            <div className="page-header">
                <div className="page-header-left">
                    <div className="skeleton skeleton-header" style={{ width: 150 }} />
                    <div className="skeleton" style={{ height: 14, width: 220, borderRadius: 4 }} />
                </div>
            </div>
            <div className="grid-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="kpi-card" style={{ opacity: 0.7 }}>
                        <div className="skeleton" style={{ width: 90, height: 12, marginBottom: 12, borderRadius: 4 }} />
                        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 4 }} />
                    </div>
                ))}
            </div>
            <div className="card">
                <div className="card-header">
                    <div className="skeleton" style={{ width: 200, height: 18, borderRadius: 4 }} />
                </div>
                <div className="card-body">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
                    ))}
                </div>
            </div>
        </div>
    )
}
