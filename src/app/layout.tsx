import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'VTN ERP — Công ty TNHH Võ Trọng Nghĩa',
  description: 'Hệ thống ERP nội bộ cho Công ty TNHH Võ Trọng Nghĩa — Quản lý CRM, Dự án, Hợp đồng, Hóa đơn và Timesheet.',
  keywords: 'ERP, kiến trúc, Võ Trọng Nghĩa, quản lý dự án',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1F3A5F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
