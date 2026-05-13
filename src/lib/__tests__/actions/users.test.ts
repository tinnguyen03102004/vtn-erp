import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'admin@vtn.com', role: 'ADMIN', name: 'Admin' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match']
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
vi.mock('bcryptjs', () => ({
    default: { hash: () => Promise.resolve('hashed') },
}))

import { getUsers, createUser, updateUser, toggleUserActive } from '@/lib/actions/users'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

describe('getUsers', () => {
    it('returns user list', async () => {
        set([{ id: '1', name: 'User1' }])
        expect(await getUsers()).toHaveLength(1)
    })
    it('returns empty array', async () => {
        set(null)
        expect(await getUsers()).toEqual([])
    })
})

describe('createUser', () => {
    it('creates with valid data', async () => {
        set({ id: 'new', name: 'New User' })
        const r = await createUser({ name: 'New User', email: 'new@vtn.vn', password: '123456' })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createUser({})).success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'Duplicate email' })
        expect((await createUser({ name: 'A', email: 'a@vtn.vn', password: '123456' })).success).toBe(false)
    })
})

describe('updateUser', () => {
    it('updates successfully', async () => {
        set({ id: '1', name: 'Updated' })
        expect((await updateUser('1', { name: 'Updated', email: 'u@vtn.vn' })).success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Error' })
        expect((await updateUser('1', { name: 'X', email: 'x@vtn.vn' })).success).toBe(false)
    })
})

describe('toggleUserActive', () => {
    it('activates user', async () => {
        set({ id: '1', isActive: true })
        expect((await toggleUserActive('1', true)).success).toBe(true)
    })
    it('deactivates user', async () => {
        set({ id: '1', isActive: false })
        expect((await toggleUserActive('1', false)).success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Not found' })
        expect((await toggleUserActive('bad', true)).success).toBe(false)
    })
})
