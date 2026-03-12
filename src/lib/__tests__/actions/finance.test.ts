import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'admin', name: 'Test' }
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
        chain[m] = vi.fn(() => chain)
    }
    chain.single = vi.fn(() => Promise.resolve(mockResult))
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

import { getInvoices, getInvoice, createInvoice, updateInvoiceState, createPayment } from '@/lib/actions/finance'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

// ================================================================

describe('getInvoices', () => {
    it('returns invoices', async () => {
        set([{ id: 'INV1', amountTotal: 50000000 }])
        expect(await getInvoices()).toHaveLength(1)
    })
    it('returns []', async () => {
        set(null)
        expect(await getInvoices()).toEqual([])
    })
})

describe('getInvoice', () => {
    it('returns invoice', async () => {
        set({ id: 'INV1', payments: [] })
        expect(await getInvoice('INV1')).toHaveProperty('id', 'INV1')
    })
    it('returns null', async () => {
        set(null)
        expect(await getInvoice('X')).toBeNull()
    })
})

describe('createInvoice', () => {
    it('creates with valid data', async () => {
        set({ id: 'INV-NEW', amountTotal: 10000000 })
        const r = await createInvoice({
            partnerName: 'Client A',
            amountUntaxed: 9000000,
            amountTotal: 10000000,
            invoiceDate: '2026-03-11',
        })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createInvoice({})).success).toBe(false)
    })
    it('fails on db error', async () => {
        set(null, { message: 'Insert failed' })
        const r = await createInvoice({
            partnerName: 'X',
            amountUntaxed: 100,
            amountTotal: 100,
            invoiceDate: '2026-03-11',
        })
        expect(r.success).toBe(false)
    })
})

describe('updateInvoiceState', () => {
    it('updates', async () => {
        set({ id: 'INV1', state: 'POSTED' })
        expect((await updateInvoiceState('INV1', 'POSTED')).success).toBe(true)
    })
    it('fails', async () => {
        set(null, { message: 'Error' })
        expect((await updateInvoiceState('INV1', 'X')).success).toBe(false)
    })
})

describe('createPayment', () => {
    it('records payment', async () => {
        // createPayment: 1) insert payment 2) select payments 3) select invoice
        // All use same mockChain, so data must satisfy all 3 calls
        // Set data as array (for "select payments" call) with amountTotal (for "select invoice" call)
        set([{ id: 'PAY1', amount: 5000000, amountTotal: 10000000 }])
        const r = await createPayment({
            invoiceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            amount: 5000000,
        })
        expect(r.success).toBe(true)
    })
    it('fails on error', async () => {
        set(null, { message: 'Duplicate' })
        const r = await createPayment({
            invoiceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            amount: 5000000,
        })
        expect(r.success).toBe(false)
    })
})
