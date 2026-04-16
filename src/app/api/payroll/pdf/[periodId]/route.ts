import { NextRequest, NextResponse } from 'next/server'
import { getPayrollPeriod } from '@/lib/actions/payroll'
import React from 'react'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ periodId: string }> }
) {
    const { periodId } = await params
    const period = await getPayrollPeriod(periodId)

    if (!period) {
        return NextResponse.json({ error: 'Kỳ lương không tồn tại' }, { status: 404 })
    }

    // Dynamic import to avoid SSR issues
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { default: PayrollSlipPDF } = await import('@/components/pdf/PayrollSlipPDF')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(PayrollSlipPDF, { period }) as any)

    const fileName = `BangLuong_T${period.month}_${period.year}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    })
}
