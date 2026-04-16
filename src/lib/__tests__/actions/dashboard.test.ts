import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache - unstable_cache should just pass through the function
vi.mock('next/cache', () => ({
    unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

// ── Per-table mock results for Promise.all concurrent queries ──
const tableResults: Record<string, { data: unknown; error: unknown; count?: number }> = {}

const createTableChain = (table: string) => {
    const getResult = () => tableResults[table] || { data: null, error: null }
    const chain: Record<string, unknown> = {}

    const makeThenable = (extra?: Record<string, unknown>) => {
        const obj = {
            ...extra,
            then: (resolve: (v: unknown) => void) => { resolve(getResult()); return Promise.resolve(getResult()) },
        }
        return obj
    }

    chain.select = vi.fn().mockImplementation(() => makeThenable({
        eq: vi.fn().mockImplementation(() => makeThenable()),
        in: vi.fn().mockImplementation(() => makeThenable()),
        order: vi.fn().mockImplementation(() => makeThenable({
            limit: vi.fn().mockImplementation(() => makeThenable()),
        })),
    }))

    return chain
}

const mockFrom = vi.fn().mockImplementation((table: string) => createTableChain(table))

vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => mockFrom(table) } }))

import { getDashboardKPIs, getRecentProjects, getRecentLeads } from '@/lib/actions/dashboard'

beforeEach(() => {
    mockFrom.mockClear()
    for (const key of Object.keys(tableResults)) delete tableResults[key]
    mockFrom.mockImplementation((table: string) => createTableChain(table))
})

// ================================================================

describe('getDashboardKPIs', () => {
    it('returns aggregated KPIs', async () => {
        tableResults['projects'] = { data: [], error: null, count: 5 }
        tableResults['invoices'] = { data: [{ amountTotal: 10000000 }], error: null }
        tableResults['employees'] = { data: [], error: null, count: 12 }
        tableResults['crm_leads'] = { data: [], error: null, count: 8 }

        const r = await getDashboardKPIs()
        expect(r.success).toBe(true)
    })

    it('fails when a query errors', async () => {
        tableResults['projects'] = { data: null, error: { message: 'DB error' } }
        tableResults['invoices'] = { data: [], error: null }
        tableResults['employees'] = { data: [], error: null }
        tableResults['crm_leads'] = { data: [], error: null }

        const r = await getDashboardKPIs()
        expect(r.success).toBe(false)
    })
})

describe('getRecentProjects', () => {
    it('returns recent projects', async () => {
        tableResults['projects'] = {
            data: [{ id: 'P1', code: 'DA-001', name: 'Villa', state: 'ACTIVE', partnerName: 'Client' }],
            error: null,
        }
        const r = await getRecentProjects()
        expect(r.success).toBe(true)
        if (r.success) expect(r.data).toHaveLength(1)
    })

    it('fails on error', async () => {
        tableResults['projects'] = { data: null, error: { message: 'Timeout' } }
        const r = await getRecentProjects()
        expect(r.success).toBe(false)
    })
})

describe('getRecentLeads', () => {
    it('returns recent leads', async () => {
        tableResults['crm_leads'] = {
            data: [{ id: 'L1', name: 'Lead A', partnerName: 'P', expectedValue: 500000000, probability: 70, source: 'Web' }],
            error: null,
        }
        const r = await getRecentLeads()
        expect(r.success).toBe(true)
        if (r.success) expect(r.data).toHaveLength(1)
    })

    it('returns empty array', async () => {
        tableResults['crm_leads'] = { data: [], error: null }
        const r = await getRecentLeads()
        expect(r.success).toBe(true)
        if (r.success) expect(r.data).toEqual([])
    })
})
