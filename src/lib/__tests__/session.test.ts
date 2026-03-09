import { describe, it, expect, vi } from 'vitest'

// Mock supabase before importing session module
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: () => ({
            insert: () => ({ error: null }),
            select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
            delete: () => ({ eq: () => Promise.resolve() }),
            update: () => ({ eq: () => ({ then: (cb: () => void) => cb() }) }),
        }),
    },
}))

import { verifySignature } from '@/lib/session'

// ================================================================
// Session Module Tests — HMAC signature verification
// Tests only the pure crypto functions (no DB dependency)
// ================================================================

describe('Session — verifySignature', () => {
    it('rejects empty string', () => {
        expect(verifySignature('')).toBe(false)
    })

    it('rejects malformed cookie (no colon)', () => {
        expect(verifySignature('no-colon-here')).toBe(false)
    })

    it('rejects tampered signature', () => {
        expect(verifySignature('token:invalidsignature')).toBe(false)
    })

    it('rejects cookie with multiple colons', () => {
        // verifyAndExtractToken splits by ":" and expects exactly 2 parts
        expect(verifySignature('a:b:c')).toBe(false)
    })
})
