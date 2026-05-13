import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'admin@vtn.com', role: 'DIRECTOR', name: 'Admin' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'order', 'limit', 'match']
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
vi.mock('@/lib/auth-guard', () => ({
    requirePermission: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))

import { getSettings, saveSettings } from '@/lib/actions/settings'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

describe('getSettings', () => {
    it('returns key-value map', async () => {
        set([{ key: 'companyName', value: 'VTN' }, { key: 'taxId', value: '123' }])
        const result = await getSettings()
        expect(result).toEqual({ companyName: 'VTN', taxId: '123' })
    })
    it('returns empty map when no data', async () => {
        set(null)
        expect(await getSettings()).toEqual({})
    })
})

describe('saveSettings', () => {
    it('saves valid settings', async () => {
        set(null) // upsert doesn't return data
        const r = await saveSettings({ companyName: 'VTN Studio', phone: '0909' })
        expect(r.success).toBe(true)
    })
    it('fails validation with bad input', async () => {
        const r = await saveSettings(null)
        expect(r.success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'DB error' })
        const r = await saveSettings({ companyName: 'X' })
        expect(r.success).toBe(false)
    })
})
