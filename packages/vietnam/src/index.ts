// ================================================================
// @vtn/vietnam — Vietnamese Market Compliance Package
// ================================================================

// Tax — VAT, PIT, CIT
export {
    calculateVat, reverseVat,
    calculatePit, PIT_PERSONAL_DEDUCTION, PIT_DEPENDENT_DEDUCTION,
    calculateCit, CIT_STANDARD_RATE, CIT_SME_RATE,
    type VatRate, type VatResult, type PitInput, type PitResult,
} from './tax'

// Currency — VND formatting, number → chữ
export {
    formatVnd, formatVndShort,
    numberToVietnameseWords,
    parseVndString,
} from './currency'

// Insurance — BHXH, BHYT, BHTN
export {
    calculateInsurance, employeeInsuranceDeduction,
    INSURANCE_RATES, BASE_SALARY, MAX_INSURABLE_SALARY,
    MIN_REGIONAL_WAGES,
    type Region, type InsuranceInput, type InsuranceResult,
} from './insurance'

// e-Invoice — NĐ123/2020
export {
    generateInvoiceSymbol, calculateInvoiceTotals, createInvoiceLine,
    isValidTaxCode, INVOICE_TYPES,
    type EInvoice, type InvoiceBuyer, type InvoiceSeller, type InvoiceLine,
} from './e-invoice'

// VAS — Chart of Accounts (TT200)
export {
    VAS_CHART_OF_ACCOUNTS,
    findAccount, getChildAccounts, getAccountsByType, getRootAccounts,
    type AccountEntry,
} from './vas'

// VietQR — Payment QR
export {
    generateVietQrUrl, findBankByBin, findBankByShortName,
    BANK_BINS,
    type VietQrParams,
} from './vietqr'
