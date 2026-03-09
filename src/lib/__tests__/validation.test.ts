import { describe, it, expect } from 'vitest'
import { validators, validateForm, hasErrors, type FieldRules } from '@/lib/validation'

// ================================================================
// Validation Utility Tests
// Tests the form validation system with unknown-typed inputs
// ================================================================

describe('validators.required', () => {
    const validate = validators.required('Tên')

    it('rejects empty string', () => {
        expect(validate('')).toBe('Tên là bắt buộc')
    })

    it('rejects null', () => {
        expect(validate(null)).toBe('Tên là bắt buộc')
    })

    it('rejects undefined', () => {
        expect(validate(undefined)).toBe('Tên là bắt buộc')
    })

    it('accepts non-empty string', () => {
        expect(validate('Nguyễn Văn A')).toBeNull()
    })

    it('accepts 0', () => {
        expect(validate(0)).toBeNull()
    })

    it('accepts false', () => {
        expect(validate(false)).toBeNull()
    })
})

describe('validators.email', () => {
    const validate = validators.email()

    it('rejects invalid email', () => {
        expect(validate('not-an-email')).toBe('Email không hợp lệ')
    })

    it('accepts valid email', () => {
        expect(validate('test@vtn.com')).toBeNull()
    })

    it('passes for empty value (optional)', () => {
        expect(validate('')).toBeNull()
    })

    it('passes for non-string types', () => {
        expect(validate(123)).toBeNull()
        expect(validate(null)).toBeNull()
    })
})

describe('validators.phone', () => {
    const validate = validators.phone()

    it('rejects too-short phone', () => {
        expect(validate('123')).toBe('Số điện thoại không hợp lệ')
    })

    it('accepts Vietnamese phone', () => {
        expect(validate('0912345678')).toBeNull()
    })

    it('accepts international format', () => {
        expect(validate('+84 912 345 678')).toBeNull()
    })

    it('passes for non-string types', () => {
        expect(validate(null)).toBeNull()
    })
})

describe('validators.minLength', () => {
    const validate = validators.minLength(6, 'Mật khẩu')

    it('rejects too-short string', () => {
        expect(validate('123')).toBe('Mật khẩu phải có ít nhất 6 ký tự')
    })

    it('accepts valid length', () => {
        expect(validate('123456')).toBeNull()
    })

    it('passes for non-string types', () => {
        expect(validate(42)).toBeNull()
    })
})

describe('validators.maxLength', () => {
    const validate = validators.maxLength(10, 'Ghi chú')

    it('rejects too-long string', () => {
        expect(validate('A'.repeat(11))).toBe('Ghi chú không được quá 10 ký tự')
    })

    it('accepts valid length', () => {
        expect(validate('Short')).toBeNull()
    })
})

describe('validators.positiveNumber', () => {
    const validate = validators.positiveNumber('Giá trị')

    it('rejects negative', () => {
        expect(validate(-5)).toBe('Giá trị phải là số dương')
    })

    it('rejects NaN string', () => {
        expect(validate('abc')).toBe('Giá trị phải là số dương')
    })

    it('accepts zero', () => {
        expect(validate(0)).toBeNull()
    })

    it('accepts positive', () => {
        expect(validate(100)).toBeNull()
    })

    it('passes for empty string', () => {
        expect(validate('')).toBeNull()
    })
})

describe('validators.minValue', () => {
    const validate = validators.minValue(1, 'Số lượng')

    it('rejects below min', () => {
        expect(validate(0)).toBe('Số lượng phải >= 1')
    })

    it('accepts at min', () => {
        expect(validate(1)).toBeNull()
    })

    it('accepts above min', () => {
        expect(validate(99)).toBeNull()
    })
})

describe('validateForm', () => {
    it('collects errors for multiple fields', () => {
        const rules: FieldRules = {
            name: [validators.required('Tên')],
            email: [validators.required('Email'), validators.email()],
        }
        const errors = validateForm({ name: '', email: '' }, rules)
        expect(errors).toHaveProperty('name')
        expect(errors).toHaveProperty('email')
    })

    it('returns empty object for valid data', () => {
        const rules: FieldRules = {
            name: [validators.required('Tên')],
        }
        const errors = validateForm({ name: 'OK' }, rules)
        expect(errors).toEqual({})
    })

    it('stops at first error per field', () => {
        const rules: FieldRules = {
            email: [validators.required('Email'), validators.email()],
        }
        const errors = validateForm({ email: '' }, rules)
        // Should only report the first error (required), not email format
        expect(errors.email).toBe('Email là bắt buộc')
    })
})

describe('hasErrors', () => {
    it('returns true when errors exist', () => {
        expect(hasErrors({ name: 'Required' })).toBe(true)
    })

    it('returns false when no errors', () => {
        expect(hasErrors({})).toBe(false)
    })
})
