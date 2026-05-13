import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'hr@vtn.com', role: 'DIRECTOR', name: 'HR' }
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
vi.mock('@/lib/auth-guard', () => ({
    requireAuth: () => Promise.resolve(mockUser),
    requirePermission: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))

import {
    getAttendancePeriods, getAttendancePeriod, getMyAttendance,
    reviewAttendanceRecord, updatePeriodState, getAttendancePeriodOptions,
} from '@/lib/actions/attendance'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }
beforeEach(() => { mockResult = { data: null, error: null }; mockChain = createMockChain(); mockFrom.mockImplementation(() => mockChain) })

describe('getAttendancePeriods', () => {
    it('returns summaries with counts', async () => {
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [{ id: 'p1', name: 'T5/2026' }], error: null }).then(resolve)
        }
        const result = await getAttendancePeriods()
        expect(result).toHaveLength(1)
        expect(result[0]).toHaveProperty('employeeCount')
    })
    it('returns empty', async () => { set(null); expect(await getAttendancePeriods()).toEqual([]) })
})

describe('getAttendancePeriod', () => {
    it('returns period detail with employee summaries', async () => {
        mockChain.single = vi.fn(() => Promise.resolve({ data: { id: 'p1', name: 'T5' }, error: null }))
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [], error: null }).then(resolve)
        }
        const result = await getAttendancePeriod('p1')
        expect(result).toHaveProperty('period')
        expect(result).toHaveProperty('employees')
    })
    it('returns null when not found', async () => {
        set(null)
        expect(await getAttendancePeriod('bad')).toBeNull()
    })
})

describe('getMyAttendance', () => {
    it('returns null when no employee record', async () => {
        set(null)
        expect(await getMyAttendance()).toBeNull()
    })
})

describe('reviewAttendanceRecord', () => {
    it('approves PENDING record', async () => {
        set({ id: 'r1', state: 'PENDING' })
        const r = await reviewAttendanceRecord('r1', 'APPROVED')
        expect(r.success).toBe(true)
    })
    it('rejects non-PENDING record', async () => {
        set({ id: 'r1', state: 'APPROVED' })
        const r = await reviewAttendanceRecord('r1', 'APPROVED')
        expect(r.success).toBe(false)
    })
    it('fails when record not found', async () => {
        set(null)
        const r = await reviewAttendanceRecord('bad', 'APPROVED')
        expect(r.success).toBe(false)
    })
})

describe('updatePeriodState', () => {
    it('changes state to REVIEW', async () => {
        set({ id: 'p1', state: 'DRAFT' })
        const r = await updatePeriodState('p1', 'REVIEW')
        expect(r.success).toBe(true)
    })
    it('blocks LOCK when pending records exist', async () => {
        let singleCallCount = 0
        mockChain.single = vi.fn(() => {
            singleCallCount++
            return Promise.resolve({ data: singleCallCount === 1 ? { id: 'p1', state: 'REVIEW' } : null, error: null })
        })
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [{ id: 'r1' }], error: null }).then(resolve)
        }
        const r = await updatePeriodState('p1', 'LOCKED')
        expect(r.success).toBe(false)
    })
    it('fails when period not found', async () => {
        set(null)
        const r = await updatePeriodState('bad', 'LOCKED')
        expect(r.success).toBe(false)
    })
})

describe('getAttendancePeriodOptions', () => {
    it('returns period options', async () => {
        set([{ id: 'p1', name: 'T5', state: 'DRAFT' }])
        const result = await getAttendancePeriodOptions()
        expect(result).toHaveLength(1)
    })
    it('returns empty', async () => {
        set(null)
        expect(await getAttendancePeriodOptions()).toEqual([])
    })
})
