'use client'

import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import ChatPanel from '@/components/chat/ChatPanel'
import type { SessionUser } from '@/lib/session'

export default function DashboardShell({
    children,
    user,
}: {
    children: React.ReactNode
    user: SessionUser
}) {
    return (
        <div className="app-shell">
            <Sidebar userRole={user.role} />
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
