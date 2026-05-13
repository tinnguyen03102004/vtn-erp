import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

function createMockChain() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {}
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit', 'match']
    for (const m of methods) { chain[m] = vi.fn(() => chain) }
    chain.single = vi.fn(() => Promise.resolve(mockResult))
    chain.maybeSingle = vi.fn(() => Promise.resolve(mockResult))
    chain.then = function (resolve: (v: unknown) => unknown) { return Promise.resolve(mockResult).then(resolve) }
    return chain
}

let mockChain = createMockChain()
const mockFrom = vi.fn(() => mockChain)

vi.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => mockFrom(t) } }))
vi.mock('@vtn/vietnam', () => ({
    formatVnd: (n: number) => `${n} đ`,
    numberToVietnameseWords: () => 'một trăm triệu đồng',
    generateVietQrUrl: () => 'https://qr.example.com/mock',
}))
vi.mock('@/lib/utils', () => ({
    escapeHtml: (s: string) => s,
}))

import { generateInvoicePDF } from '@/lib/actions/invoice-pdf'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }
beforeEach(() => { mockResult = { data: null, error: null }; mockChain = createMockChain(); mockFrom.mockImplementation(() => mockChain) })

describe('generateInvoicePDF', () => {
    it('generates HTML for valid invoice', async () => {
        let singleCallCount = 0
        mockChain.single = vi.fn(() => {
            singleCallCount++
            if (singleCallCount === 1) {
                return Promise.resolve({
                    data: { id: 'inv-1', name: 'INV-001', amountTotal: 100000000, state: 'POSTED', partnerName: 'ABC Corp', invoiceDate: '2026-01-15' },
                    error: null,
                })
            }
            return Promise.resolve({ data: null, error: null })
        })
        mockChain.then = function (resolve: (v: unknown) => unknown) {
            return Promise.resolve({ data: [], error: null }).then(resolve)
        }
        const r = await generateInvoicePDF('inv-1')
        expect(r.success).toBe(true)
        expect(r.data?.html).toContain('INV-001')
        expect(r.data?.invoiceName).toBe('INV-001')
    })

    it('fails when invoice not found', async () => {
        set(null)
        const r = await generateInvoicePDF('bad')
        expect(r.success).toBe(false)
        expect(r.error).toContain('not found')
    })
})
