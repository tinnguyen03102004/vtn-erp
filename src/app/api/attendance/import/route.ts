import { NextRequest, NextResponse } from 'next/server'
import { parseAttendanceExcel } from '@/lib/attendance-parser'

/**
 * POST /api/attendance/import
 * Accepts multipart/form-data with an Excel file
 * Returns parsed preview data (does not save to DB — client calls importAttendance action)
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
        }

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            return NextResponse.json({ error: 'Chỉ hỗ trợ file Excel (.xlsx, .xls)' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const result = parseAttendanceExcel(buffer)

        return NextResponse.json({
            ok: true,
            data: result,
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Lỗi không xác định'
        return NextResponse.json({ error: `Parse thất bại: ${message}` }, { status: 500 })
    }
}
