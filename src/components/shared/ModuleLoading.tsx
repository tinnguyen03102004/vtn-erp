interface ModuleLoadingProps {
    /** Number of skeleton cards in the top row */
    cards?: number
    /** Show table skeleton */
    showTable?: boolean
}

export default function ModuleLoading({ cards = 0, showTable = true }: ModuleLoadingProps) {
    return (
        <div className="loading-skeleton">
            <div className="skeleton skeleton-header" />
            {cards > 0 && (
                <div className="skeleton-row">
                    {Array.from({ length: cards }, (_, i) => (
                        <div key={i} className="skeleton skeleton-card" />
                    ))}
                </div>
            )}
            {showTable && <div className="skeleton skeleton-table" />}
        </div>
    )
}
