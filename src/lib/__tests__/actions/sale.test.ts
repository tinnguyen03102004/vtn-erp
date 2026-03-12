import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'admin', name: 'Test' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit']) {
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

vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => mockFrom(table) } }))
vi.mock('@/lib/auth-guard', () => ({ requirePermission: () => Promise.resolve(mockUser) }))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))

import {
    getOrders, getOrder, createOrder, deleteOrder,
    sendQuotation, approveQuotation, rejectQuotation,
    signContract, updateOrderState,
} from '@/lib/actions/sale'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

// ================================================================

describe('getOrders', () => {
    it('returns orders', async () => {
        set([{ id: 'O1', code: 'QT-001' }])
        expect(await getOrders()).toHaveLength(1)
    })
    it('returns []', async () => {
        set(null)
        expect(await getOrders()).toEqual([])
    })
})

describe('getOrder', () => {
    it('returns single order', async () => {
        set({ id: 'O1', code: 'QT-001' })
        expect(await getOrder('O1')).toHaveProperty('id', 'O1')
    })
    it('returns null', async () => {
        set(null)
        expect(await getOrder('X')).toBeNull()
    })
})

describe('createOrder', () => {
    it('creates with valid data', async () => {
        set({ id: 'O-NEW', state: 'DRAFT' })
        const r = await createOrder({ partnerName: 'Client A' })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createOrder({})).success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'Insert failed' })
        expect((await createOrder({ partnerName: 'X' })).success).toBe(false)
    })
})

describe('deleteOrder', () => {
    it('deletes successfully', async () => {
        set(null, null)
        const r = await deleteOrder('O1')
        expect(r.success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Constraint' })
        expect((await deleteOrder('O1')).success).toBe(false)
    })
})

describe('State machine', () => {
    it('sendQuotation', async () => {
        set({ id: 'O1', state: 'SENT' })
        expect((await sendQuotation('O1')).success).toBe(true)
    })
    it('approveQuotation', async () => {
        set({ id: 'O1', state: 'APPROVED' })
        expect((await approveQuotation('O1')).success).toBe(true)
    })
    it('rejectQuotation', async () => {
        set({ id: 'O1', state: 'REJECTED' })
        expect((await rejectQuotation('O1', 'Giá cao')).success).toBe(true)
    })
    it('signContract', async () => {
        set({ id: 'O1', state: 'SIGNED' })
        expect((await signContract('O1')).success).toBe(true)
    })
    it('updateOrderState', async () => {
        set({ id: 'O1', state: 'DONE' })
        expect((await updateOrderState('O1', 'DONE')).success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Update failed' })
        expect((await sendQuotation('O1')).success).toBe(false)
    })
})
