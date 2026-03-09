import { describe, it, expect } from 'vitest'
import { ok, fail, type ActionResult } from '@/lib/action-result'

// ================================================================
// ActionResult Pattern Tests — Extended
// Covers type narrowing, generics, and edge cases
// ================================================================

describe('ActionResult — ok()', () => {
    it('returns success: true with data', () => {
        const result = ok({ id: '1', name: 'Test' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.id).toBe('1')
            expect(result.data.name).toBe('Test')
        }
    })

    it('works with void data', () => {
        const result = ok(undefined)
        expect(result.success).toBe(true)
    })

    it('works with array data', () => {
        const result = ok([1, 2, 3])
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).toHaveLength(3)
        }
    })

    it('preserves type narrowing', () => {
        const result: ActionResult<{ count: number }> = ok({ count: 42 })
        if (result.success) {
            // TypeScript should infer result.data.count as number
            expect(result.data.count).toBe(42)
        }
    })
})

describe('ActionResult — fail()', () => {
    it('returns success: false with error message', () => {
        const result = fail('Something went wrong')
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toBe('Something went wrong')
        }
    })

    it('includes field errors when provided', () => {
        const result = fail('Validation failed', { name: 'Required', email: 'Invalid' })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.fieldErrors?.name).toBe('Required')
            expect(result.fieldErrors?.email).toBe('Invalid')
        }
    })

    it('fieldErrors is undefined when not provided', () => {
        const result = fail('Error')
        if (!result.success) {
            expect(result.fieldErrors).toBeUndefined()
        }
    })

    it('is assignable to any ActionResult<T>', () => {
        // fail() returns ActionResult<never>, which is assignable to ActionResult<any T>
        const result: ActionResult<{ id: string }> = fail('Not found')
        expect(result.success).toBe(false)
    })
})

describe('ActionResult — pattern usage', () => {
    it('success branch has no error field', () => {
        const result = ok({ value: 'test' })
        if (result.success) {
            // @ts-expect-error — error should not exist on success branch
            const _err = result.error
            expect(_err).toBeUndefined()
        }
    })

    it('failure branch has no data field', () => {
        const result = fail('Error')
        if (!result.success) {
            // @ts-expect-error — data should not exist on failure branch
            const _data = result.data
            expect(_data).toBeUndefined()
        }
    })
})
