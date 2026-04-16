// ================================================================
// @vtn/vietnam/currency — Formatting tiền tệ & chuyển số thành chữ
// ================================================================

/**
 * Format số tiền theo chuẩn VND: 1.234.567 ₫
 */
export function formatVnd(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(num)
}

/**
 * Format số tiền rút gọn: 1.2M, 500K, 1.5B
 */
export function formatVndShort(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} tỷ`
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} triệu`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
    return `${amount}`
}

// ── Chuyển số thành chữ tiếng Việt ──

const ONES = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const POSITIONS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']

function readThreeDigits(n: number): string {
    if (n === 0) return ''

    const hundreds = Math.floor(n / 100)
    const tens = Math.floor((n % 100) / 10)
    const ones = n % 10

    const parts: string[] = []

    if (hundreds > 0) {
        parts.push(`${ONES[hundreds]} trăm`)
    }

    if (tens === 0 && ones > 0 && hundreds > 0) {
        parts.push('lẻ')
    }

    if (tens === 1) {
        parts.push('mười')
    } else if (tens > 1) {
        parts.push(`${ONES[tens]} mươi`)
    }

    if (ones === 1 && tens > 1) {
        parts.push('mốt')
    } else if (ones === 5 && tens > 0) {
        parts.push('lăm')
    } else if (ones > 0 && !(ones === 1 && tens > 1) && !(ones === 5 && tens > 0)) {
        parts.push(ONES[ones])
    }

    return parts.join(' ')
}

/**
 * Chuyển số tiền thành chữ tiếng Việt.
 *
 * @example
 * numberToVietnameseWords(1500000)
 * // → "Một triệu năm trăm nghìn đồng"
 *
 * @example
 * numberToVietnameseWords(0)
 * // → "Không đồng"
 */
export function numberToVietnameseWords(amount: number, currency = 'đồng'): string {
    if (amount === 0) return `Không ${currency}`
    if (amount < 0) return `Âm ${numberToVietnameseWords(-amount, currency)}`

    // Round to remove decimals
    const intAmount = Math.round(amount)

    // Split into groups of 3 digits from right
    const groups: number[] = []
    let remaining = intAmount
    while (remaining > 0) {
        groups.push(remaining % 1000)
        remaining = Math.floor(remaining / 1000)
    }

    const parts: string[] = []
    for (let i = groups.length - 1; i >= 0; i--) {
        const text = readThreeDigits(groups[i])
        if (text) {
            parts.push(`${text} ${POSITIONS[i]}`.trim())
        }
    }

    const result = parts.join(' ').replace(/\s+/g, ' ').trim()
    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1) + ` ${currency}`
}

/**
 * Parse chuỗi tiền VND (có dấu chấm phân cách) → number.
 * @example parseVndString("1.500.000") → 1500000
 */
export function parseVndString(value: string): number {
    const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
}
