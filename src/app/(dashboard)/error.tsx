'use client'

import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[Dashboard Error]', error)
    }, [error])

    return (
        <div className="error-boundary">
            <div className="error-boundary-icon">{'⚠️'}</div>
            <h2>Có lỗi xảy ra</h2>
            <p>{error.message || 'Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.'}</p>
            <button className="btn btn-primary" onClick={reset}>
                Thử lại
            </button>
        </div>
    )
}
