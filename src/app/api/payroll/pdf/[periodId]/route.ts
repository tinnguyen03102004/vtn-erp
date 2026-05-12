import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import React from 'react'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ periodId: string }> }
) {
    // Direct auth check (don't call server action from route handler)
    const session = await getSessionFromCookies()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['DIRECTOR', 'FINANCE'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { periodId } = await params

    // Fetch period
    const { data: period } = await db.from('payroll_periods').select('*').eq('id', periodId).single()
    if (!period) {
        return NextResponse.json({ error: 'Kỳ lương không tồn tại' }, { status: 404 })
    }

    // Fetch slips + employee info
    const { data: slips } = await db
        .from('payroll_slips')
        .select('*')
        .eq('periodId', periodId)
        .order('createdAt')

    const { data: employees } = await supabase.from('employees').select('id, userId, department, position')
    const { data: users } = await supabase.from('users').select('id, name, email')

    const enrichedSlips = (slips || []).map((slip: Record<string, unknown>) => {
        const emp = (employees || []).find((e: Record<string, unknown>) => e.id === slip.employeeId)
        const user = emp ? (users || []).find((u: Record<string, unknown>) => u.id === emp.userId) : null
        return { ...slip, employee: emp ? { ...emp, user } : null }
    })

    const fullPeriod = { ...period, slips: enrichedSlips }

    try {
        // Dynamic import to avoid SSR issues
        const { renderToBuffer } = await import('@react-pdf/renderer')
        const { default: PayrollSlipPDF } = await import('@/components/pdf/PayrollSlipPDF')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buffer = await renderToBuffer(React.createElement(PayrollSlipPDF, { period: fullPeriod }) as any)
        const fileName = `BangLuong_T${period.month}_${period.year}.pdf`

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        })
    } catch (pdfError) {
        // Fallback: CSV export if PDF generation fails (font issues, etc.)
        console.error('PDF generation failed, falling back to CSV:', pdfError)

        const fmtNum = (n: unknown) => Number(n || 0).toLocaleString('vi-VN')

        let csv = '\uFEFF'
        csv += `BẢNG LƯƠNG THÁNG ${period.month}/${period.year}\r\n`
        csv += `Trạng thái: ${period.state === 'PAID' ? 'Đã chi trả' : period.state === 'CONFIRMED' ? 'Đã xác nhận' : 'Nháp'}\r\n\r\n`
        csv += `STT,Nhân viên,Gross,BHXH,BHYT,BHTN,Thuế TNCN,Khấu trừ,Net\r\n`

        enrichedSlips.forEach((slip: Record<string, unknown>, i: number) => {
            const emp = slip.employee as Record<string, unknown> | null
            const user = emp?.user as Record<string, unknown> | null
            const name = ((user?.name as string) || '—').replace(/,/g, ' ')
            csv += `${i + 1},${name},${fmtNum(slip.grossSalary)},${fmtNum(slip.bhxhEmployee)},${fmtNum(slip.bhytEmployee)},${fmtNum(slip.bhtnEmployee)},${fmtNum(slip.pitAmount)},${fmtNum(slip.totalDeductions)},${fmtNum(slip.netSalary)}\r\n`
        })

        const fileName = `BangLuong_T${period.month}_${period.year}.csv`
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        })
    }
}
