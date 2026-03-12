export default function DashboardPageLoading() {
    return (
        <div className="loading-skeleton">
            <div className="skeleton skeleton-header" />
            <div className="skeleton-row">
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
            </div>
            <div className="skeleton-row">
                <div className="skeleton skeleton-card" style={{ height: 240, flex: 2 }} />
                <div className="skeleton skeleton-card" style={{ height: 240 }} />
            </div>
            <div className="skeleton skeleton-table" />
        </div>
    )
}
