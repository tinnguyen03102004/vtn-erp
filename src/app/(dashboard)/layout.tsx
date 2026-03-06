'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import ChatPanel from '@/components/ChatPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#F8F9FB',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48, height: 48, border: '3px solid #E2E8F0',
                        borderTopColor: '#1F3A5F', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#1F3A5F', fontSize: 16 }}>
                        VTN ERP
                    </div>
                    <div style={{ fontSize: 13, color: '#8FA3BF', marginTop: 4 }}>Đang tải...</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Header
                    title="VTN ERP"
                    user={{ name: user.name, email: user.email, role: user.role }}
                />
                <main className="page-content animate-fade-in">
                    {children}
                </main>
            </div>
            <ChatPanel />
        </div>
    )
}
