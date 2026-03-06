'use client'

// ================================================================
// FORM VALIDATION UTILITY for VTN-ERP
// ================================================================

type ValidatorFn = (value: any) => string | null

export const validators = {
    required: (label: string): ValidatorFn => (value) =>
        (!value && value !== 0 && value !== false) ? `${label} là bắt buộc` : null,

    email: (): ValidatorFn => (value) =>
        value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email không hợp lệ' : null,

    phone: (): ValidatorFn => (value) =>
        value && !/^[+]?[\d\s()-]{8,15}$/.test(value) ? 'Số điện thoại không hợp lệ' : null,

    minLength: (min: number, label: string): ValidatorFn => (value) =>
        value && value.length < min ? `${label} phải có ít nhất ${min} ký tự` : null,

    maxLength: (max: number, label: string): ValidatorFn => (value) =>
        value && value.length > max ? `${label} không được quá ${max} ký tự` : null,

    positiveNumber: (label: string): ValidatorFn => (value) =>
        value !== undefined && value !== '' && (isNaN(Number(value)) || Number(value) < 0) ? `${label} phải là số dương` : null,

    minValue: (min: number, label: string): ValidatorFn => (value) =>
        value !== undefined && value !== '' && Number(value) < min ? `${label} phải >= ${min}` : null,
}

export type FieldRules = Record<string, ValidatorFn[]>

export function validateForm(data: Record<string, any>, rules: FieldRules): Record<string, string> {
    const errors: Record<string, string> = {}
    for (const [field, fieldValidators] of Object.entries(rules)) {
        for (const validate of fieldValidators) {
            const error = validate(data[field])
            if (error) { errors[field] = error; break }
        }
    }
    return errors
}

export function hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0
}

// Field error display component (inline)
export function FieldError({ error }: { error?: string }) {
    if (!error) return null
    return (
        <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
        </div>
    )
}
