// ================================================================
// @vtn/vietnam/tax — Tính thuế Việt Nam
// VAT, PIT (thuế TNCN), CIT (thuế TNDN)
// Theo Luật Thuế hiện hành 2024-2026
// ================================================================

// ── VAT (Thuế GTGT) ──

export type VatRate = 0 | 5 | 8 | 10

export interface VatResult {
    /** Giá trước thuế */
    amountUntaxed: number
    /** Thuế suất áp dụng */
    vatRate: VatRate
    /** Số tiền thuế */
    vatAmount: number
    /** Tổng cộng sau thuế */
    amountTotal: number
}

/**
 * Tính VAT cho một số tiền.
 * @param amountUntaxed - Giá trước thuế
 * @param rate - Thuế suất (0%, 5%, 8%, 10%). Mặc định 10%.
 */
export function calculateVat(amountUntaxed: number, rate: VatRate = 10): VatResult {
    const vatAmount = Math.round(amountUntaxed * rate / 100)
    return {
        amountUntaxed,
        vatRate: rate,
        vatAmount,
        amountTotal: amountUntaxed + vatAmount,
    }
}

/**
 * Tính ngược từ tổng tiền đã bao gồm VAT → giá trước thuế.
 */
export function reverseVat(amountTotal: number, rate: VatRate = 10): VatResult {
    const amountUntaxed = Math.round(amountTotal / (1 + rate / 100))
    const vatAmount = amountTotal - amountUntaxed
    return {
        amountUntaxed,
        vatRate: rate,
        vatAmount,
        amountTotal,
    }
}

// ── PIT (Thuế Thu Nhập Cá Nhân) — Biểu thuế lũy tiến 7 bậc ──

interface PitBracket {
    /** Ngưỡng thu nhập (triệu VND/tháng) */
    threshold: number
    /** Thuế suất (%) */
    rate: number
}

/**
 * Biểu thuế lũy tiến từng phần — Điều 22 Luật Thuế TNCN.
 * Thu nhập tính thuế = Thu nhập chịu thuế - Giảm trừ gia cảnh.
 */
const PIT_BRACKETS: PitBracket[] = [
    { threshold: 5_000_000, rate: 5 },
    { threshold: 10_000_000, rate: 10 },
    { threshold: 18_000_000, rate: 15 },
    { threshold: 32_000_000, rate: 20 },
    { threshold: 52_000_000, rate: 25 },
    { threshold: 80_000_000, rate: 30 },
    { threshold: Infinity, rate: 35 },
]

/** Giảm trừ bản thân: 11 triệu/tháng (Nghị quyết 954/2020) */
export const PIT_PERSONAL_DEDUCTION = 11_000_000

/** Giảm trừ người phụ thuộc: 4.4 triệu/tháng/người */
export const PIT_DEPENDENT_DEDUCTION = 4_400_000

export interface PitInput {
    /** Thu nhập chịu thuế (sau trừ BHXH/BHYT/BHTN) */
    taxableIncome: number
    /** Số người phụ thuộc */
    dependents?: number
}

export interface PitResult {
    /** Thu nhập tính thuế (sau giảm trừ gia cảnh) */
    assessableIncome: number
    /** Tổng thuế TNCN phải nộp */
    taxAmount: number
    /** Thuế suất hiệu dụng (%) */
    effectiveRate: number
    /** Chi tiết từng bậc */
    brackets: { range: string; rate: number; tax: number }[]
}

/**
 * Tính thuế TNCN theo biểu lũy tiến 7 bậc.
 * @param input.taxableIncome - Thu nhập chịu thuế/tháng (sau trừ BHXH)
 * @param input.dependents - Số người phụ thuộc (mặc định 0)
 */
export function calculatePit(input: PitInput): PitResult {
    const { taxableIncome, dependents = 0 } = input
    const deduction = PIT_PERSONAL_DEDUCTION + dependents * PIT_DEPENDENT_DEDUCTION
    const assessableIncome = Math.max(0, taxableIncome - deduction)

    let remaining = assessableIncome
    let totalTax = 0
    let prevThreshold = 0
    const brackets: PitResult['brackets'] = []

    for (const bracket of PIT_BRACKETS) {
        if (remaining <= 0) break

        const width = bracket.threshold === Infinity
            ? remaining
            : Math.min(remaining, bracket.threshold - prevThreshold)

        const tax = Math.round(width * bracket.rate / 100)
        totalTax += tax

        if (width > 0) {
            brackets.push({
                range: `${formatMillions(prevThreshold)} → ${bracket.threshold === Infinity ? '∞' : formatMillions(bracket.threshold)}`,
                rate: bracket.rate,
                tax,
            })
        }

        remaining -= width
        prevThreshold = bracket.threshold
    }

    return {
        assessableIncome,
        taxAmount: totalTax,
        effectiveRate: assessableIncome > 0 ? Math.round(totalTax / assessableIncome * 10000) / 100 : 0,
        brackets,
    }
}

function formatMillions(amount: number): string {
    if (amount >= 1_000_000) return `${amount / 1_000_000}tr`
    return `${amount}`
}

// ── CIT (Thuế Thu Nhập Doanh Nghiệp) ──

/** Thuế suất CIT chuẩn: 20% */
export const CIT_STANDARD_RATE = 20

/** Thuế suất CIT cho SME (doanh thu < 200 tỷ): 17% — theo dự thảo */
export const CIT_SME_RATE = 17

/**
 * Tính thuế TNDN đơn giản (thuế suất chuẩn 20%).
 * @param taxableProfit - Thu nhập tính thuế (sau trừ chi phí hợp lệ)
 * @param rate - Thuế suất CIT (mặc định 20%)
 */
export function calculateCit(taxableProfit: number, rate = CIT_STANDARD_RATE): {
    taxableProfit: number
    rate: number
    taxAmount: number
} {
    return {
        taxableProfit,
        rate,
        taxAmount: Math.round(taxableProfit * rate / 100),
    }
}
