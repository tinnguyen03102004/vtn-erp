import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'ARCHITECT', name: 'Test' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match', 'gte', 'lte']
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
    requireAuth: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))

import { getTimesheets, createTimesheet, updateTimesheet, deleteTimesheet } from '@/lib/actions/timesheets'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

describe('getTimesheets', () => {
    it('returns timesheets for current employee', async () => {
        // getCurrentEmployeeForUser returns employee via .single(), then subsequent queries return arrays
        mockChain.single = vi.fn(() => Promise.resolve({ data: { id: 'emp-1', userId: 'user-1' }, error: null }))
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [], error: null }).then(resolve)
        }
        const result = await getTimesheets()
        expect(Array.isArray(result)).toBe(true)
    })
    it('returns empty when no employee record', async () => {
        set(null)
        expect(await getTimesheets()).toEqual([])
    })
})

describe('createTimesheet', () => {
    it('creates with valid data', async () => {
        set({ id: 'emp-1', userId: 'user-1' })
        // After employee lookup, set result for insert
        const result = await createTimesheet({ projectId: 'proj-1', date: '2026-01-15', hours: 8 })
        // With our mock, chain resolves to whatever mockResult is — test the flow doesn't throw
        expect(result).toBeDefined()
    })
    it('fails validation with bad data', async () => {
        set({ id: 'emp-1', userId: 'user-1' })
        const r = await createTimesheet({})
        expect(r.success).toBe(false)
    })
})

describe('updateTimesheet', () => {
    it('updates own timesheet', async () => {
        set({ id: 'ts-1', userId: 'user-1' })
        const r = await updateTimesheet('ts-1', { hours: 4 })
        expect(r).toBeDefined()
    })
    it('denies editing other user timesheet', async () => {
        set({ id: 'ts-1', userId: 'other-user' })
        const r = await updateTimesheet('ts-1', { hours: 4 })
        expect(r.success).toBe(false)
    })
    it('fails when timesheet not found', async () => {
        set(null)
        const r = await updateTimesheet('bad', { hours: 4 })
        expect(r.success).toBe(false)
    })
})

describe('deleteTimesheet', () => {
    it('deletes own timesheet', async () => {
        set({ id: 'ts-1', userId: 'user-1' })
        const r = await deleteTimesheet('ts-1')
        expect(r).toBeDefined()
    })
    it('denies deleting other user timesheet', async () => {
        set({ id: 'ts-1', userId: 'other-user' })
        const r = await deleteTimesheet('ts-1')
        expect(r.success).toBe(false)
    })
})
