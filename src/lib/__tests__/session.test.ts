import { describe, it, expect } from 'vitest'

import { verifySignature } from '@/lib/session-crypto'

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
