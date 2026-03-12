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
            <div className="error-boundary-icon">â ï¸</div>
            <h2>Lá»-i táº¡i {moduleName}</h2>
            <p>{error.message || 'ÄÃ£ xáº£y ra lá»-i khÃ´ng mong Äá»£i. Vui lÃ²ng thá»­ láº¡i.'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={reset}>
                    Thá»­ láº¡i
                </button>
                <button className="btn btn-outline" onClick={() => window.location.href = '/dashboard'}>
                    Vá» Dashboard
                </button>
            </div>
        </div>
    )
}
