'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="vi">
            <body style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                background: '#0F172A',
                color: '#E2E8F0',
            }}>
                <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                        Có lỗi xảy ra
                    </h2>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
                        {error.message || 'Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.'}
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                            onClick={reset}
                            style={{
                                padding: '10px 24px',
                                background: '#D4A843',
                                color: '#0F172A',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            style={{
                                padding: '10px 24px',
                                background: 'transparent',
                                color: '#94A3B8',
                                border: '1px solid #334155',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                        >
                            Đăng nhập lại
                        </button>
                    </div>
                    {error.digest && (
                        <p style={{ fontSize: 11, color: '#475569', marginTop: 16 }}>
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    )
}
