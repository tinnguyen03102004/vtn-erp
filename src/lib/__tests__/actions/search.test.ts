import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match', 'ilike']
    for (const m of methods) {
        chain[m] = vi.fn(() => chain)
    }
    chain.single = vi.fn(() => Promise.resolve(mockResult))
    chain.maybeSingle = vi.fn(() => Promise.resolve(mockResult))
    chain.then = function (resolve: (v: unknown) => unknown) {
        return Promise.resolve(mockResult).then(resolve)
    }
    return chain
}

let mockChain = createMockChain()
const mockFrom = vi.fn((_table?: string) => mockChain)

vi.mock('@/lib/supabase', () => ({
    supabase: { from: (table: string) => mockFrom(table) },
}))

import { globalSearch } from '@/lib/actions/search'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

describe('globalSearch', () => {
    it('returns empty for short query', async () => {
        const r = await globalSearch('a')
        expect(r.success).toBe(true)
        expect(r.data).toEqual([])
    })
    it('returns empty for empty query', async () => {
        const r = await globalSearch('')
        expect(r.success).toBe(true)
        expect(r.data).toEqual([])
    })
    it('returns search results across entities', async () => {
        set([{ id: 'L1', name: 'Lead Test', partnerName: 'Partner' }])
        const r = await globalSearch('Test')
        expect(r.success).toBe(true)
        expect(r.data!.length).toBeGreaterThan(0)
    })
    it('fails when query errors', async () => {
        set(null, { message: 'Search error' })
        const r = await globalSearch('Test')
        expect(r.success).toBe(false)
    })
})
