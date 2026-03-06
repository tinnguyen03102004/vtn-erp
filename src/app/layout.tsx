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
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
