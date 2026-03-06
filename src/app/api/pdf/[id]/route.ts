import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/lib/actions/sale'
import React from 'react'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const order = await getOrder(id)

    if (!order) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Dynamic import to avoid SSR issues
    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { default: SaleOrderPDF } = await import('@/components/pdf/SaleOrderPDF')

    const buffer = await renderToBuffer(React.createElement(SaleOrderPDF, { order }) as any)

    const isQuotation = order.docType === 'QUOTATION'
    const fileName = `${isQuotation ? 'BaoGia' : 'HopDong'}_${order.name?.replace(/\s+/g, '_') || id}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        },
    })
}
