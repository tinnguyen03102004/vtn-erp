import { describe, it, expect } from 'vitest'
import {
    calculateVat, reverseVat,
    calculatePit, PIT_PERSONAL_DEDUCTION, PIT_DEPENDENT_DEDUCTION,
    calculateCit,
    formatVnd, formatVndShort, numberToVietnameseWords, parseVndString,
    calculateInsurance, employeeInsuranceDeduction,
    generateInvoiceSymbol, createInvoiceLine, calculateInvoiceTotals, isValidTaxCode,
    findAccount, getChildAccounts, getAccountsByType, getRootAccounts,
    generateVietQrUrl, findBankByBin, BANK_BINS,
} from '../src/index'

// ── VAT ──
describe('VAT', () => {
    it('tính 10% VAT chuẩn', () => {
        const r = calculateVat(10_000_000)
        expect(r.vatRate).toBe(10)
        expect(r.vatAmount).toBe(1_000_000)
        expect(r.amountTotal).toBe(11_000_000)
    })

    it('tính 8% VAT', () => {
        const r = calculateVat(10_000_000, 8)
        expect(r.vatAmount).toBe(800_000)
    })

    it('0% VAT (xuất khẩu)', () => {
        const r = calculateVat(50_000_000, 0)
        expect(r.vatAmount).toBe(0)
        expect(r.amountTotal).toBe(50_000_000)
    })

    it('tính ngược VAT', () => {
        const r = reverseVat(11_000_000, 10)
        expect(r.amountUntaxed).toBe(10_000_000)
        expect(r.vatAmount).toBe(1_000_000)
    })
})

// ── PIT ──
describe('PIT (Thuế TNCN)', () => {
    it('thu nhập dưới giảm trừ → thuế = 0', () => {
        const r = calculatePit({ taxableIncome: 10_000_000 })
        expect(r.taxAmount).toBe(0)
    })

    it('thu nhập 20tr, 0 NPT → tính thuế đúng', () => {
        const r = calculatePit({ taxableIncome: 20_000_000 })
        // assessable = 20M - 11M = 9M → 5M × 5% + 4M × 10% = 250K + 400K = 650K
        expect(r.assessableIncome).toBe(9_000_000)
        expect(r.taxAmount).toBe(650_000)
    })

    it('thu nhập 30tr, 1 NPT', () => {
        const r = calculatePit({ taxableIncome: 30_000_000, dependents: 1 })
        // assessable = 30M - 11M - 4.4M = 14.6M
        expect(r.assessableIncome).toBe(14_600_000)
        expect(r.taxAmount).toBeGreaterThan(0)
        expect(r.effectiveRate).toBeGreaterThan(0)
    })

    it('giảm trừ gia cảnh đúng giá trị', () => {
        expect(PIT_PERSONAL_DEDUCTION).toBe(11_000_000)
        expect(PIT_DEPENDENT_DEDUCTION).toBe(4_400_000)
    })
})

// ── CIT ──
describe('CIT (Thuế TNDN)', () => {
    it('thuế suất chuẩn 20%', () => {
        const r = calculateCit(100_000_000)
        expect(r.taxAmount).toBe(20_000_000)
    })

    it('thuế suất SME 17%', () => {
        const r = calculateCit(100_000_000, 17)
        expect(r.taxAmount).toBe(17_000_000)
    })
})

// ── Currency ──
describe('Currency', () => {
    it('formatVnd', () => {
        const s = formatVnd(1_500_000)
        expect(s).toContain('1.500.000')
    })

    it('formatVndShort', () => {
        expect(formatVndShort(1_500_000)).toBe('1.5 triệu')
        expect(formatVndShort(2_000_000_000)).toBe('2 tỷ')
        expect(formatVndShort(500_000)).toBe('500K')
    })

    it('numberToVietnameseWords', () => {
        expect(numberToVietnameseWords(0)).toBe('Không đồng')
        expect(numberToVietnameseWords(1_500_000)).toContain('triệu')
        expect(numberToVietnameseWords(1_500_000)).toContain('đồng')
    })

    it('parseVndString', () => {
        expect(parseVndString('1.500.000')).toBe(1500000)
        expect(parseVndString('0')).toBe(0)
    })
})

// ── Insurance ──
describe('BHXH/BHYT/BHTN', () => {
    it('tính BH cho lương 15 triệu', () => {
        const r = calculateInsurance({ insurableSalary: 15_000_000 })
        expect(r.employee.socialInsurance).toBe(1_200_000) // 8%
        expect(r.employee.healthInsurance).toBe(225_000)   // 1.5%
        expect(r.employee.total).toBeGreaterThan(0)
        expect(r.employer.total).toBeGreaterThan(0)
        expect(r.grandTotal).toBe(r.employee.total + r.employer.total)
    })

    it('cap lương đóng BHXH ở 20 × lương cơ sở', () => {
        const r = calculateInsurance({ insurableSalary: 999_000_000 })
        expect(r.insurableSalary).toBeLessThan(999_000_000)
    })

    it('employeeInsuranceDeduction shortcut', () => {
        const deduction = employeeInsuranceDeduction(15_000_000)
        expect(deduction).toBeGreaterThan(0)
        expect(deduction).toBeLessThan(15_000_000)
    })
})

// ── e-Invoice ──
describe('e-Invoice', () => {
    it('tạo ký hiệu hóa đơn', () => {
        expect(generateInvoiceSymbol('1', 24, 'TAA')).toBe('1C24TAA')
        expect(generateInvoiceSymbol('2', 25)).toBe('2C25TAA')
    })

    it('tạo dòng hóa đơn', () => {
        const line = createInvoiceLine({
            lineNumber: 1,
            description: 'Thiết kế kiến trúc',
            unit: 'bộ',
            quantity: 1,
            unitPrice: 50_000_000,
        })
        expect(line.amountUntaxed).toBe(50_000_000)
        expect(line.vatRate).toBe(10) // default
        expect(line.vatAmount).toBe(5_000_000)
        expect(line.amountTotal).toBe(55_000_000)
    })

    it('tổng hóa đơn', () => {
        const lines = [
            createInvoiceLine({ lineNumber: 1, description: 'Mục 1', quantity: 2, unitPrice: 1_000_000 }),
            createInvoiceLine({ lineNumber: 2, description: 'Mục 2', quantity: 1, unitPrice: 5_000_000 }),
        ]
        const totals = calculateInvoiceTotals(lines)
        expect(totals.totalUntaxed).toBe(7_000_000)
        expect(totals.totalVat).toBe(700_000)
        expect(totals.lineCount).toBe(2)
    })

    it('validate MST', () => {
        expect(isValidTaxCode('0123456789')).toBe(true)
        expect(isValidTaxCode('0123456789-001')).toBe(true)
        expect(isValidTaxCode('123')).toBe(false)
        expect(isValidTaxCode('')).toBe(false)
    })
})

// ── VAS ──
describe('VAS TT200', () => {
    it('tìm tài khoản 111 (Tiền mặt)', () => {
        const acc = findAccount('111')
        expect(acc).toBeDefined()
        expect(acc!.name).toBe('Tiền mặt')
    })

    it('lấy tài khoản con', () => {
        const children = getChildAccounts('111')
        expect(children.length).toBeGreaterThan(0)
        expect(children[0].parentCode).toBe('111')
    })

    it('lấy tài khoản theo loại', () => {
        const assets = getAccountsByType('asset')
        expect(assets.length).toBeGreaterThan(5)
    })

    it('lấy tài khoản gốc', () => {
        const roots = getRootAccounts()
        expect(roots.every(a => a.level === 1)).toBe(true)
    })
})

// ── VietQR ──
describe('VietQR', () => {
    it('tạo QR URL', () => {
        const url = generateVietQrUrl({
            bankBin: '970422',
            accountNumber: '0123456789',
            amount: 1_500_000,
            memo: 'test',
        })
        expect(url).toContain('img.vietqr.io')
        expect(url).toContain('970422')
        expect(url).toContain('1500000')
    })

    it('tìm ngân hàng theo BIN', () => {
        const bank = findBankByBin('970422')
        expect(bank).toBeDefined()
        expect(bank!.shortName).toBe('MB')
    })

    it('BANK_BINS có đủ ngân hàng lớn', () => {
        expect(Object.keys(BANK_BINS).length).toBeGreaterThanOrEqual(10)
    })
})
