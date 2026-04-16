// ================================================================
// @vtn/vietnam/e-invoice — Hóa đơn điện tử theo NĐ123/2020/NĐ-CP
// ================================================================

/**
 * Ký hiệu mẫu hóa đơn điện tử theo NĐ123.
 * Format: C{loại}YY (C = e-invoice, Y = year)
 */
export type InvoiceSymbolPrefix = '1' | '2' | '3' | '4' | '5' | '6'

export interface EInvoice {
    /** Ký hiệu mẫu số: 1 = GTGT, 2 = bán hàng, etc. */
    templateCode: InvoiceSymbolPrefix
    /** Ký hiệu hóa đơn: C23TAA → CKK (AA = mã CQT) */
    invoiceSymbol: string
    /** Số hóa đơn (8 chữ số, do CQT cấp) */
    invoiceNumber: string
    /** Ngày lập hóa đơn */
    issueDate: Date
    /** Người mua */
    buyer: InvoiceBuyer
    /** Người bán */
    seller: InvoiceSeller
    /** Dòng hàng hóa/dịch vụ */
    lines: InvoiceLine[]
    /** Hình thức thanh toán */
    paymentMethod: 'TM' | 'CK' | 'TM/CK'
    /** Tỷ giá (nếu ngoại tệ) */
    exchangeRate?: number
    /** Ghi chú */
    note?: string
}

export interface InvoiceBuyer {
    name: string
    taxCode?: string
    address?: string
    email?: string
    bankAccount?: string
    bankName?: string
}

export interface InvoiceSeller {
    name: string
    taxCode: string
    address: string
    phone?: string
    email?: string
    bankAccount?: string
    bankName?: string
}

export interface InvoiceLine {
    /** STT */
    lineNumber: number
    /** Tên hàng hóa/dịch vụ */
    description: string
    /** Đơn vị tính */
    unit?: string
    /** Số lượng */
    quantity: number
    /** Đơn giá trước thuế */
    unitPrice: number
    /** Thuế suất VAT (%) */
    vatRate: 0 | 5 | 8 | 10
    /** Thành tiền trước thuế */
    amountUntaxed: number
    /** Tiền thuế */
    vatAmount: number
    /** Thành tiền sau thuế */
    amountTotal: number
}

/**
 * Loại hóa đơn theo NĐ123.
 */
export const INVOICE_TYPES = {
    '1': 'Hóa đơn giá trị gia tăng',
    '2': 'Hóa đơn bán hàng',
    '3': 'Hóa đơn bán tài sản công',
    '4': 'Hóa đơn bán hàng dự trữ quốc gia',
    '5': 'Tem, vé, thẻ điện tử',
    '6': 'Phiếu xuất kho kiêm vận chuyển nội bộ / hàng gửi bán đại lý',
} as const

/**
 * Tạo ký hiệu hóa đơn theo NĐ123.
 * Format: {loại}C{năm}{ký hiệu CQT}
 *
 * @example generateInvoiceSymbol('1', 24, 'TAA')
 * // → '1C24TAA'
 */
export function generateInvoiceSymbol(
    type: InvoiceSymbolPrefix,
    year: number,
    taxAuthCode: string = 'TAA'
): string {
    const yy = String(year).slice(-2)
    return `${type}C${yy}${taxAuthCode}`
}

/**
 * Tính tổng hóa đơn từ danh sách dòng.
 */
export function calculateInvoiceTotals(lines: InvoiceLine[]): {
    totalUntaxed: number
    totalVat: number
    totalAmount: number
    lineCount: number
} {
    return {
        totalUntaxed: lines.reduce((sum, l) => sum + l.amountUntaxed, 0),
        totalVat: lines.reduce((sum, l) => sum + l.vatAmount, 0),
        totalAmount: lines.reduce((sum, l) => sum + l.amountTotal, 0),
        lineCount: lines.length,
    }
}

/**
 * Tạo một dòng hóa đơn với tự động tính tiền.
 */
export function createInvoiceLine(params: {
    lineNumber: number
    description: string
    unit?: string
    quantity: number
    unitPrice: number
    vatRate?: 0 | 5 | 8 | 10
}): InvoiceLine {
    const vatRate = params.vatRate ?? 10
    const amountUntaxed = Math.round(params.quantity * params.unitPrice)
    const vatAmount = Math.round(amountUntaxed * vatRate / 100)

    return {
        lineNumber: params.lineNumber,
        description: params.description,
        unit: params.unit,
        quantity: params.quantity,
        unitPrice: params.unitPrice,
        vatRate,
        amountUntaxed,
        vatAmount,
        amountTotal: amountUntaxed + vatAmount,
    }
}

/**
 * Validate mã số thuế Việt Nam (MST).
 * Format: 10 chữ số hoặc 13 chữ số (10-XXX).
 */
export function isValidTaxCode(taxCode: string): boolean {
    if (!taxCode) return false
    const cleaned = taxCode.replace(/[^0-9-]/g, '')
    return /^\d{10}(-\d{3})?$/.test(cleaned) || /^\d{10}\d{3}$/.test(cleaned)
}
