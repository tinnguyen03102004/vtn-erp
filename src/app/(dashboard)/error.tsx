'use client'

import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[Dashboard Error]', error)
    }, [error])

    return (
        <div className="error-boundary">
            <div className="error-boundary-icon">â ï¸</div>
            <h2>CÃ³ lá»-i xáº£y ra</h2>
            <p>{error.message || 'ÄÃ£ xáº£y ra lá»-i khÃ´ng mong Äá»£i. Vui lÃ²ng thá»­ láº¡i.'}</p>
            <button className="btn btn-primary" onClick={reset}>
                Thá»­ láº¡i
            </button>
        </div>
    )
}
