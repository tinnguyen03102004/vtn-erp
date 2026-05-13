import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'admin', name: 'Test' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match', 'gte', 'lte', 'ilike']
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
    requirePermission: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))
vi.mock('@vtn/logger', () => ({
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))
vi.mock('@vtn/vietnam', () => ({
    calculateInsurance: () => ({ bhxh: 0, bhyt: 0, bhtn: 0, totalEmployee: 0, totalEmployer: 0 }),
    formatVnd: (n: number) => `${n} đ`,
}))
vi.mock('bcryptjs', () => ({
    default: { hash: () => Promise.resolve('hashed') },
}))

import { getEmployees, getEmployee, getCurrentEmployee, createEmployee, updateEmployee } from '@/lib/actions/employees'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

describe('getEmployees', () => {
    it('returns employee list with user info', async () => {
        set([{ id: 'emp-1', userId: 'user-1' }])
        const result = await getEmployees()
        expect(result).toHaveLength(1)
        expect(result[0]).toHaveProperty('totalHours')
    })
    it('returns empty array when no data', async () => {
        set(null)
        expect(await getEmployees()).toEqual([])
    })
})

describe('getEmployee', () => {
    it('returns single employee', async () => {
        set({ id: 'emp-1', userId: 'user-1' })
        expect(await getEmployee('emp-1')).toHaveProperty('id', 'emp-1')
    })
    it('returns null when not found', async () => {
        set(null)
        expect(await getEmployee('bad')).toBeNull()
    })
})

describe('getCurrentEmployee', () => {
    it('returns current user employee', async () => {
        set({ id: 'emp-1', userId: 'user-1' })
        const result = await getCurrentEmployee()
        expect(result).toHaveProperty('user')
    })
    it('returns null when employee record missing', async () => {
        set(null)
        expect(await getCurrentEmployee()).toBeNull()
    })
})

describe('createEmployee', () => {
    it('creates with valid data', async () => {
        set({ id: 'new-emp', name: 'Nguyen Van A' })
        const r = await createEmployee({ name: 'Nguyen Van A', email: 'a@vtn.vn' })
        expect(r.success).toBe(true)
    })
    it('fails validation with empty input', async () => {
        expect((await createEmployee({})).success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'DB error' })
        const r = await createEmployee({ name: 'A', email: 'a@vtn.vn' })
        expect(r.success).toBe(false)
    })
})

describe('updateEmployee', () => {
    it('updates successfully', async () => {
        set({ id: 'emp-1', userId: 'user-1' })
        expect((await updateEmployee('emp-1', { name: 'Updated' })).success).toBe(true)
    })
    it('fails when employee not found', async () => {
        set(null)
        expect((await updateEmployee('bad', { name: 'X' })).success).toBe(false)
    })
})
