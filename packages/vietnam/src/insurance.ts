// ================================================================
// @vtn/vietnam/insurance — Bảo hiểm bắt buộc Việt Nam
// BHXH, BHYT, BHTN — theo Luật BHXH 2024
// ================================================================

/**
 * Tỷ lệ đóng bảo hiểm bắt buộc (% lương đóng BH).
 * Áp dụng từ 01/07/2024 theo Luật BHXH 2024.
 */
export const INSURANCE_RATES = {
    employee: {
        /** BHXH: 8% (hưu trí + tử tuất) */
        socialInsurance: 8,
        /** BHYT: 1.5% */
        healthInsurance: 1.5,
        /** BHTN: 1% */
        unemploymentInsurance: 1,
        /** Tổng NLĐ đóng: 10.5% */
        get total() { return this.socialInsurance + this.healthInsurance + this.unemploymentInsurance },
    },
    employer: {
        /** BHXH: 17% (ốm đau 3% + thai sản 2% + TNLĐ-BNN 0.5% + hưu trí 14% - giảm 3%) */
        socialInsurance: 17,
        /** BHYT: 3% */
        healthInsurance: 3,
        /** BHTN: 1% */
        unemploymentInsurance: 1,
        /** Tổng NSDLĐ đóng: 21% — giảm từ 21.5% */
        get total() { return this.socialInsurance + this.healthInsurance + this.unemploymentInsurance },
    },
} as const

/** Mức lương cơ sở: 2,340,000 VND/tháng (từ 01/07/2024) */
export const BASE_SALARY = 2_340_000

/** Mức lương tối đa đóng BHXH: 20 lần lương cơ sở */
export const MAX_INSURABLE_SALARY = BASE_SALARY * 20

/** Mức lương tối đa đóng BHTN: 20 lần lương tối thiểu vùng */
export const MIN_REGIONAL_WAGES = {
    region1: 4_960_000,
    region2: 4_410_000,
    region3: 3_860_000,
    region4: 3_450_000,
} as const

export type Region = keyof typeof MIN_REGIONAL_WAGES

export interface InsuranceInput {
    /** Lương đóng bảo hiểm (VND/tháng) */
    insurableSalary: number
    /** Vùng lương tối thiểu */
    region?: Region
}

export interface InsuranceResult {
    /** Lương đóng BH (đã cap) */
    insurableSalary: number
    employee: {
        socialInsurance: number
        healthInsurance: number
        unemploymentInsurance: number
        total: number
    }
    employer: {
        socialInsurance: number
        healthInsurance: number
        unemploymentInsurance: number
        total: number
    }
    /** Tổng phải đóng (NLĐ + NSDLĐ) */
    grandTotal: number
}

/**
 * Tính bảo hiểm bắt buộc cho nhân viên.
 *
 * @param input.insurableSalary - Lương đóng bảo hiểm
 * @param input.region - Vùng lương tối thiểu (mặc định region1)
 */
export function calculateInsurance(input: InsuranceInput): InsuranceResult {
    const { region = 'region1' } = input
    const cappedSalary = Math.min(input.insurableSalary, MAX_INSURABLE_SALARY)
    const maxUnemployment = MIN_REGIONAL_WAGES[region] * 20
    const unemploymentSalary = Math.min(input.insurableSalary, maxUnemployment)

    const employee = {
        socialInsurance: Math.round(cappedSalary * INSURANCE_RATES.employee.socialInsurance / 100),
        healthInsurance: Math.round(cappedSalary * INSURANCE_RATES.employee.healthInsurance / 100),
        unemploymentInsurance: Math.round(unemploymentSalary * INSURANCE_RATES.employee.unemploymentInsurance / 100),
        get total() { return this.socialInsurance + this.healthInsurance + this.unemploymentInsurance },
    }

    const employer = {
        socialInsurance: Math.round(cappedSalary * INSURANCE_RATES.employer.socialInsurance / 100),
        healthInsurance: Math.round(cappedSalary * INSURANCE_RATES.employer.healthInsurance / 100),
        unemploymentInsurance: Math.round(unemploymentSalary * INSURANCE_RATES.employer.unemploymentInsurance / 100),
        get total() { return this.socialInsurance + this.healthInsurance + this.unemploymentInsurance },
    }

    return {
        insurableSalary: cappedSalary,
        employee,
        employer,
        grandTotal: employee.total + employer.total,
    }
}

/**
 * Tính nhanh tổng khấu trừ BH của nhân viên.
 * Dùng để tính thu nhập chịu thuế = Lương gross - BH nhân viên.
 */
export function employeeInsuranceDeduction(insurableSalary: number, region: Region = 'region1'): number {
    const result = calculateInsurance({ insurableSalary, region })
    return result.employee.total
}
