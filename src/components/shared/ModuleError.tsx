'use client'

import { useEffect } from 'react'

interface ModuleErrorProps {
    error: Error & { digest?: string }
    reset: () => void
    moduleName: string
}

export default function ModuleError({ error, reset, moduleName }: ModuleErrorProps) {
    useEffect(() => {
        console.error(`[${moduleName} Error]`, error)
    }, [error, moduleName])

    return (
        <div className="error-boundary">
            <div className="error-boundary-icon">{'⚠️'}</div>
            <h2>Lỗi tại {moduleName}</h2>
            <p>{error.message || 'Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={reset}>
                    Thử lại
                </button>
                <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>
                    Về Dashboard
                </button>
            </div>
        </div>
    )
}
