import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Unified mock — supports both await chain (thenable) and .single() terminal ──
const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'admin', name: 'Test' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match']
    for (const m of methods) {
        chain[m] = vi.fn(() => chain)
    }
    // Terminal: .single() returns a Promise
    chain.single = vi.fn(() => Promise.resolve(mockResult))
    chain.maybeSingle = vi.fn(() => Promise.resolve(mockResult))
    // Make chain thenable (for `await supabase.from('x').select('*')` without .single())
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
vi.mock('@/lib/auth-guard', () => ({ requirePermission: () => Promise.resolve(mockUser) }))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))

import { getStages, getLeads, getLead, createLead, updateLead } from '@/lib/actions/crm'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

// ================================================================

describe('getStages', () => {
    it('returns stages', async () => {
        set([{ id: '1', name: 'New' }])
        expect(await getStages()).toHaveLength(1)
    })
    it('returns []', async () => {
        set(null)
        expect(await getStages()).toEqual([])
    })
})

describe('getLeads', () => {
    it('returns leads', async () => {
        set([{ id: 'L1' }])
        expect(await getLeads()).toHaveLength(1)
    })
    it('returns []', async () => {
        set(null)
        expect(await getLeads()).toEqual([])
    })
})

describe('getLead', () => {
    it('returns lead', async () => {
        set({ id: 'L1', name: 'A' })
        expect(await getLead('L1')).toHaveProperty('id', 'L1')
    })
    it('returns null', async () => {
        set(null)
        expect(await getLead('X')).toBeNull()
    })
})

describe('createLead', () => {
    it('creates with valid data', async () => {
        set({ id: 'L-NEW', name: 'New' })
        const r = await createLead({ name: 'New', partnerName: 'P', source: 'Web' })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createLead({})).success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'DB error' })
        expect((await createLead({ name: 'X', partnerName: 'P', source: 'Web' })).success).toBe(false)
    })
})

describe('updateLead', () => {
    it('updates successfully', async () => {
        set({ id: 'L1', name: 'Updated' })
        expect((await updateLead('L1', { name: 'Updated' })).success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Error' })
        expect((await updateLead('L1', { name: 'X' })).success).toBe(false)
    })
})
