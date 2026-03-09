import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatRelativeTime, getInitials, truncate, escapeHtml } from '@/lib/utils'

// ================================================================
// Utils Tests — Pure function unit tests
// ================================================================

describe('formatCurrency', () => {
    it('formats VND by default', () => {
        const result = formatCurrency(50000000)
        expect(result).toContain('50.000.000')
    })

    it('handles 0', () => {
        const result = formatCurrency(0)
        expect(result).toContain('0')
    })

    it('accepts string input', () => {
        const result = formatCurrency('1500000')
        expect(result).toContain('1.500.000')
    })

    it('respects currency parameter', () => {
        const result = formatCurrency(100, 'USD')
        expect(result).toContain('100')
    })
})

describe('formatDate', () => {
    it('formats Date object', () => {
        const result = formatDate(new Date(2026, 2, 9))  // March 9, 2026
        expect(result).toBe('09/03/2026')
    })

    it('formats ISO string', () => {
        const result = formatDate('2026-01-15T00:00:00Z')
        // Exact output depends on timezone, just check format pattern
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })

    it('returns dash for null', () => {
        expect(formatDate(null)).toBe('—')
    })

    it('returns dash for undefined', () => {
        expect(formatDate(undefined)).toBe('—')
    })
})

describe('formatRelativeTime', () => {
    it('returns "Hôm nay" for today', () => {
        const result = formatRelativeTime(new Date())
        expect(result).toBe('Hôm nay')
    })

    it('returns "Hôm qua" for yesterday', () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const result = formatRelativeTime(yesterday)
        expect(result).toBe('Hôm qua')
    })

    it('returns "X ngày trước" for 2-6 days', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        const result = formatRelativeTime(threeDaysAgo)
        expect(result).toBe('3 ngày trước')
    })

    it('returns "X tuần trước" for 7-29 days', () => {
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const result = formatRelativeTime(twoWeeksAgo)
        expect(result).toBe('2 tuần trước')
    })

    it('returns formatted date for 30+ days', () => {
        const longAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        const result = formatRelativeTime(longAgo)
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })

    it('accepts ISO string', () => {
        const result = formatRelativeTime(new Date().toISOString())
        expect(result).toBe('Hôm nay')
    })
})

describe('getInitials', () => {
    it('extracts first two initials', () => {
        expect(getInitials('Nguyễn Văn A')).toBe('NV')
    })

    it('handles single name', () => {
        expect(getInitials('Admin')).toBe('A')
    })

    it('handles three-word name', () => {
        expect(getInitials('Trần Thị Bích Ngọc')).toBe('TT')
    })
})

describe('truncate', () => {
    it('truncates long string', () => {
        const long = 'A'.repeat(100)
        const result = truncate(long, 50)
        expect(result.length).toBe(53) // 50 + '...'
        expect(result.endsWith('...')).toBe(true)
    })

    it('returns short string unchanged', () => {
        expect(truncate('Hello', 50)).toBe('Hello')
    })

    it('handles exact length', () => {
        expect(truncate('12345', 5)).toBe('12345')
    })
})

describe('escapeHtml', () => {
    it('escapes all HTML entities', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        )
    })

    it('escapes ampersand', () => {
        expect(escapeHtml('A & B')).toBe('A &amp; B')
    })

    it('escapes single quotes', () => {
        expect(escapeHtml("it's")).toBe("it&#39;s")
    })

    it('returns empty string for null', () => {
        expect(escapeHtml(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
        expect(escapeHtml(undefined)).toBe('')
    })
})
