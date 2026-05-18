export default function LeaveLoading() {
    return (
        <div className="loading-skeleton">
            <div className="skeleton skeleton-header" />
            <div className="skeleton-row">
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
                <div className="skeleton skeleton-card" />
            </div>
            <div className="skeleton skeleton-table" />
        </div>
    )
}
