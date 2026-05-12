import * as XLSX from 'xlsx'

export interface ParsedAttendanceRow {
    date: string           // YYYY-MM-DD
    machineId: string      // ID from machine (e.g. "364")
    employeeName: string   // Họ và Tên
    checkIn: string | null // HH:MM:SS or null
    checkOut: string | null
    workHours: number      // calculated
}

export interface ParsedSheet {
    sheetName: string
    machineId: string
    employeeName: string
    rows: ParsedAttendanceRow[]
    totalWorkDays: number
    avgHours: number
}

export interface ParseResult {
    periodName: string       // "Tháng 01/2026"
    startDate: string        // YYYY-MM-DD
    endDate: string          // YYYY-MM-DD
    sheets: ParsedSheet[]
    warnings: string[]
}

/**
 * Parse Excel file from time clock machine
 * Format: 1 file, multiple sheets (1 per employee)
 * Each sheet: STT | Ngày | ID | Họ và Tên | Giờ Vào | Giờ Ra
 */
export function parseAttendanceExcel(buffer: Buffer): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const warnings: string[] = []
    const sheets: ParsedSheet[] = []
    let periodStart = ''
    let periodEnd = ''
    let periodName = ''

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) continue

        const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false,
        })

        if (rawData.length < 4) {
            warnings.push(`Sheet "${sheetName}": Quá ít dữ liệu (${rawData.length} dòng), bỏ qua`)
            continue
        }

        // Extract period from row 2 (e.g. "Từ ngày 01/01/2026 đến ngày 31/01/2026")
        if (!periodStart) {
            const headerRow = String(rawData[1]?.[0] ?? rawData[0]?.[0] ?? '')
            const dateMatch = headerRow.match(/(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/)
            if (dateMatch) {
                periodStart = parseDateStr(dateMatch[1])
                periodEnd = parseDateStr(dateMatch[2])
                const startParts = dateMatch[1].split('/')
                periodName = `Tháng ${startParts[0]}/${startParts[2]}`
            }
        }

        // Find header row (contains "STT" or "Ngày")
        let headerIdx = -1
        for (let i = 0; i < Math.min(5, rawData.length); i++) {
            const row = rawData[i]
            const rowStr = (row || []).map(c => String(c).trim().toLowerCase()).join(' ')
            if (rowStr.includes('stt') || rowStr.includes('ngày') || rowStr.includes('ngay')) {
                headerIdx = i
                break
            }
        }
        if (headerIdx < 0) {
            warnings.push(`Sheet "${sheetName}": Không tìm thấy header, bỏ qua`)
            continue
        }

        // Parse data rows
        const rows: ParsedAttendanceRow[] = []
        let sheetMachineId = ''
        let sheetEmployeeName = ''

        for (let i = headerIdx + 1; i < rawData.length; i++) {
            const row = rawData[i]
            if (!row || row.length < 4) continue

            const stt = String(row[0] ?? '').trim()
            if (!stt || isNaN(Number(stt))) continue

            const dateStr = String(row[1] ?? '').trim()
            const machineId = String(row[2] ?? '').trim()
            const name = String(row[3] ?? '').trim()
            const checkInRaw = String(row[4] ?? '').trim()
            const checkOutRaw = String(row[5] ?? '').trim()

            if (!dateStr || !machineId) continue

            sheetMachineId = machineId
            sheetEmployeeName = name

            const date = parseDateStr(dateStr)
            if (!date) {
                warnings.push(`Sheet "${sheetName}" dòng ${i + 1}: Ngày không hợp lệ "${dateStr}"`)
                continue
            }

            const checkIn = parseTimeStr(checkInRaw) || null
            const checkOut = parseTimeStr(checkOutRaw) || null
            const workHours = calculateWorkHours(checkIn, checkOut)

            rows.push({ date, machineId, employeeName: name, checkIn, checkOut, workHours })
        }

        if (rows.length === 0) {
            warnings.push(`Sheet "${sheetName}": Không có dữ liệu hợp lệ`)
            continue
        }

        const workDays = rows.filter(r => r.checkIn && r.checkOut).length
        const totalHours = rows.reduce((s, r) => s + r.workHours, 0)

        sheets.push({
            sheetName,
            machineId: sheetMachineId,
            employeeName: sheetEmployeeName,
            rows,
            totalWorkDays: workDays,
            avgHours: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0,
        })
    }

    if (!periodStart || !periodEnd) {
        // Fallback: detect from data
        const allDates = sheets.flatMap(s => s.rows.map(r => r.date)).filter(Boolean).sort()
        if (allDates.length > 0) {
            periodStart = allDates[0]
            periodEnd = allDates[allDates.length - 1]
            const d = new Date(periodStart)
            periodName = `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        }
    }

    return { periodName, startDate: periodStart, endDate: periodEnd, sheets, warnings }
}

/**
 * Parse date string (DD/MM/YYYY or MM/DD/YYYY) to YYYY-MM-DD
 * Heuristic: if first part > 12, it's DD/MM/YYYY
 */
function parseDateStr(str: string): string {
    if (!str) return ''
    const parts = str.split('/')
    if (parts.length !== 3) return ''

    const a = parseInt(parts[0], 10)
    const b = parseInt(parts[1], 10)
    const c = parseInt(parts[2], 10)

    let day: number, month: number, year: number

    if (a > 12) {
        // DD/MM/YYYY
        day = a; month = b; year = c
    } else if (b > 12) {
        // MM/DD/YYYY
        month = a; day = b; year = c
    } else {
        // Ambiguous — assume MM/DD/YYYY (US format from Excel)
        month = a; day = b; year = c
    }

    if (year < 100) year += 2000
    if (month < 1 || month > 12 || day < 1 || day > 31) return ''

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Parse time string like "08:42:18" or Excel serial
 */
function parseTimeStr(str: string): string | null {
    if (!str) return null

    // Already HH:MM:SS format
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (timeMatch) {
        const h = timeMatch[1].padStart(2, '0')
        const m = timeMatch[2]
        const s = timeMatch[3] || '00'
        return `${h}:${m}:${s}`
    }

    // Excel serial number (e.g., 0.354166... = 08:30)
    const num = parseFloat(str)
    if (!isNaN(num) && num >= 0 && num < 1) {
        const totalMinutes = Math.round(num * 24 * 60)
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    }

    return null
}

/**
 * Calculate work hours with 1h lunch break deduction if worked > 5h
 */
function calculateWorkHours(checkIn: string | null, checkOut: string | null): number {
    if (!checkIn || !checkOut) return 0

    const inParts = checkIn.split(':').map(Number)
    const outParts = checkOut.split(':').map(Number)

    const inMinutes = inParts[0] * 60 + inParts[1] + (inParts[2] || 0) / 60
    const outMinutes = outParts[0] * 60 + outParts[1] + (outParts[2] || 0) / 60

    let hours = (outMinutes - inMinutes) / 60
    if (hours < 0) hours += 24 // overnight shift

    // Deduct 1h lunch break if worked > 5h
    if (hours > 5) hours -= 1

    return Math.round(hours * 100) / 100
}
