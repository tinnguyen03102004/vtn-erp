import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'finance@vtn.com', role: 'FINANCE', name: 'Finance' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match', 'gte', 'lte']
    for (const m of methods) { chain[m] = vi.fn(() => chain) }
    chain.single = vi.fn(() => Promise.resolve(mockResult))
    chain.maybeSingle = vi.fn(() => Promise.resolve(mockResult))
    chain.then = function (resolve: (v: unknown) => unknown) { return Promise.resolve(mockResult).then(resolve) }
    return chain
}

let mockChain = createMockChain()
const mockFrom = vi.fn(() => mockChain)

vi.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => mockFrom(t) } }))
vi.mock('@/lib/auth-guard', () => ({ requirePermission: () => Promise.resolve(mockUser) }))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))
vi.mock('@vtn/logger', () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))
vi.mock('@vtn/vietnam', () => ({
    calculateInsurance: () => ({ bhxh: 0, bhyt: 0, bhtn: 0, totalEmployee: 0, totalEmployer: 0 }),
    calculatePit: () => 0, formatVnd: (n: number) => `${n}`,
}))

import { getPayrollPeriods, getPayrollPeriod, createPayrollPeriod, confirmPayroll, markPayrollPaid } from '@/lib/actions/payroll'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }
beforeEach(() => { mockResult = { data: null, error: null }; mockChain = createMockChain(); mockFrom.mockImplementation(() => mockChain) })

describe('getPayrollPeriods', () => {
    it('returns list', async () => { set([{ id: 'p1' }]); expect(await getPayrollPeriods()).toHaveLength(1) })
    it('returns empty', async () => { set(null); expect(await getPayrollPeriods()).toEqual([]) })
})

describe('getPayrollPeriod', () => {
    it('returns period', async () => {
        // First call returns period (single), subsequent calls return arrays
        let callCount = 0
        mockChain.single = vi.fn(() => {
            callCount++
            return Promise.resolve(callCount === 1 ? { data: { id: 'p1', year: 2026 }, error: null } : { data: null, error: null })
        })
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [], error: null }).then(resolve)
        }
        expect(await getPayrollPeriod('p1')).toHaveProperty('id')
    })
    it('returns null', async () => { set(null); expect(await getPayrollPeriod('bad')).toBeNull() })
})

describe('createPayrollPeriod', () => {
    it('creates', async () => {
        // Action calls .single() twice: 1st for duplicate check (should return null), 2nd for insert
        let singleCallCount = 0
        mockChain.single = vi.fn(() => {
            singleCallCount++
            if (singleCallCount === 1) {
                // Duplicate check: no existing record
                return Promise.resolve({ data: null, error: null })
            }
            // Insert result
            return Promise.resolve({ data: { id: 'p-new', month: 5, year: 2026, state: 'DRAFT' }, error: null })
        })
        expect((await createPayrollPeriod({ year: 2026, month: 5, workDays: 22 })).success).toBe(true)
    })
    it('fails validation', async () => { expect((await createPayrollPeriod({})).success).toBe(false) })
    it('fails db', async () => { set(null, { message: 'err' }); expect((await createPayrollPeriod({ year: 2026, month: 5, workDays: 22 })).success).toBe(false) })
})

describe('confirmPayroll', () => {
    it('confirms', async () => { set({ id: 'p1', state: 'DRAFT' }); expect(await confirmPayroll('p1')).toBeDefined() })
})

describe('markPayrollPaid', () => {
    it('marks paid', async () => { set({ id: 'p1', state: 'CONFIRMED' }); expect(await markPayrollPaid('p1')).toBeDefined() })
})
