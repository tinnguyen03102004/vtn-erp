'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        startTransition(async () => {
            try {
                const res = await fetch('/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                })
                const data = await res.json()
                if (data.ok) {
                    router.push('/dashboard')
                    router.refresh()
                } else {
                    setError('Email hoặc mật khẩu không đúng')
                }
            } catch {
                setError('Lỗi kết nối, vui lòng thử lại')
            }
        })
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-logo">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M16 2L2 28h28L16 2z" fill="currentColor" opacity="0.9" />
                            <path d="M16 8L6 26h20L16 8z" fill="white" opacity="0.2" />
                        </svg>
                        VTN
                    </div>
                    <p className="login-tagline">Architects</p>
                </div>
                <div className="login-hero">
                    <h1>Hệ thống quản lý<br /><span>văn phòng kiến trúc</span></h1>
                    <p>Quản lý toàn bộ vòng đời dự án từ lead đến nghiệm thu — CRM, hợp đồng, dự án, hóa đơn và timesheet trong một nền tảng duy nhất.</p>
                    <div className="login-features">
                        {['CRM & Báo giá', 'Quản lý Dự án', 'Hóa đơn & Thanh toán', 'Timesheet'].map(f => (
                            <div key={f} className="login-feature-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-form-container">
                    <div className="login-form-header">
                        <h2>Đăng nhập</h2>
                        <p>Nhập thông tin tài khoản của bạn</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="email@vtn.vn"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mật khẩu</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="login-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isPending}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            {isPending ? (
                                <span className="login-spinner" />
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-demo-accounts">
                        <p className="login-demo-title">Tài khoản demo:</p>
                        <div className="login-demo-grid">
                            {[
                                { role: 'Director', email: 'director@vtn.vn', color: '#1F3A5F' },
                                { role: 'PM', email: 'pm@vtn.vn', color: '#2A4D7F' },
                                { role: 'Architect', email: 'arch@vtn.vn', color: '#C9A84C' },
                                { role: 'Finance', email: 'finance@vtn.vn', color: '#22C55E' },
                            ].map(a => (
                                <button
                                    key={a.email}
                                    type="button"
                                    className="login-demo-btn"
                                    onClick={() => { setEmail(a.email); setPassword('password123') }}
                                    style={{ borderColor: a.color + '40', color: a.color }}
                                >
                                    <span style={{ background: a.color, color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                                        {a.role}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#8FA3BF' }}>{a.email}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: #fff;
        }
        .login-left {
          flex: 1;
          background: linear-gradient(135deg, var(--color-primary) 0%, #0D2340 100%);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(201,168,76,0.08);
          top: -200px;
          right: -100px;
        }
        .login-left::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          bottom: -100px;
          left: -50px;
        }
        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
        }
        .login-tagline {
          color: var(--color-accent);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .login-hero {
          position: relative;
          z-index: 1;
        }
        .login-hero h1 {
          font-size: 40px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.1;
        }
        .login-hero h1 span {
          color: var(--color-accent);
        }
        .login-hero p {
          color: rgba(255,255,255,0.65);
          font-size: 15px;
          line-height: 1.7;
          max-width: 400px;
          margin-bottom: 28px;
        }
        .login-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          font-weight: 500;
        }
        .login-feature-item svg {
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .login-right {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #fff;
        }
        .login-form-container {
          width: 100%;
          max-width: 380px;
        }
        .login-form-header {
          margin-bottom: 32px;
        }
        .login-form-header h2 {
          font-size: 28px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 6px;
        }
        .login-form-header p {
          color: var(--color-text-muted);
          font-size: 14px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
        }
        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-demo-accounts {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--color-border);
        }
        .login-demo-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }
        .login-demo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .login-demo-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 8px 10px;
          background: var(--color-surface);
          border: 1.5px solid;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .login-demo-btn:hover {
          background: var(--color-surface-2);
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; padding: 32px 24px; }
        }
      `}</style>
        </div>
    )
}
