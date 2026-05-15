import { describe, it, expect, vi, beforeAll } from 'vitest'

// ================================================================
// ServerQueryBuilder — API Parity Tests
//
// PURPOSE: Ensure the custom Prisma wrapper implements ALL methods
// that Supabase client provides. This prevents the "range() is not
// a function" class of bugs where a method is used in app code
// but missing from the wrapper.
//
// INCIDENT: 2026-05-15 — Audit page crash because ServerQueryBuilder
// lacked .range() method. 55/55 E2E tests passed because no test
// navigated to /audit.
// ================================================================

// Mock Supabase client (server-supabase.ts imports it at module level)
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({}),
        rpc: vi.fn(),
        storage: {},
    }),
}))

// Mock Prisma (prevents actual DB connection)
vi.mock('@/lib/prisma', () => ({
    prisma: new Proxy({}, {
        get: () => ({
            findMany: vi.fn().mockResolvedValue([]),
            findFirst: vi.fn().mockResolvedValue(null),
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({}),
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
            update: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            upsert: vi.fn().mockResolvedValue({}),
            $executeRaw: vi.fn().mockResolvedValue(0),
        }),
    }),
}))

/**
 * List of ALL Supabase PostgREST builder methods that our app uses.
 * If a new method is added to app code, add it here FIRST.
 */
const REQUIRED_METHODS = [
    // Query building
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    // Filters
    'eq',
    'in',
    'gte',
    'lte',
    'ilike',
    // Modifiers
    'order',
    'limit',
    'range',   // ← This was the missing method that caused the crash
    'single',
    // Thenable (for await)
    'then',
]

/**
 * Methods that real Supabase client has but our wrapper does NOT need yet.
 * When app code starts using these, move them to REQUIRED_METHODS.
 */
const KNOWN_UNIMPLEMENTED = [
    'neq', 'gt', 'lt', 'like', 'is',
    'contains', 'containedBy', 'or', 'not', 'match',
    'filter', 'textSearch', 'maybeSingle', 'csv',
    'returns', 'explain', 'abortSignal', 'throwOnError',
]

const APP_TABLES = [
    'users', 'accounts', 'employees', 'crm_stages', 'crm_leads',
    'sale_orders', 'sale_order_lines', 'sale_milestones',
    'projects', 'project_phases', 'project_tasks',
    'invoices', 'payments', 'timesheets', 'settings',
    'attachments', 'app_sessions',
    'payroll_periods', 'payroll_slips',
    'audit_logs',
    'attendance_periods', 'attendance_records',
]

// Dynamic import after mocks are set up
let serverSupabase: { from: (table: string) => Record<string, unknown> }

beforeAll(async () => {
    const mod = await import('@/lib/server-supabase')
    serverSupabase = mod.serverSupabase
})

describe('ServerQueryBuilder — API Parity', () => {
    it('serverSupabase.from() returns a builder object', () => {
        const builder = serverSupabase.from('audit_logs')
        expect(builder).toBeDefined()
        expect(typeof builder).toBe('object')
    })

    describe('Required Supabase methods exist', () => {
        for (const method of REQUIRED_METHODS) {
            it(`has .${method}() method`, () => {
                const builder = serverSupabase.from('audit_logs')
                expect(typeof builder[method]).toBe('function')
            })
        }
    })

    describe('Method chaining returns builder (fluent API)', () => {
        it('.select() returns chainable builder', () => {
            const builder = serverSupabase.from('audit_logs') as Record<string, (...args: unknown[]) => Record<string, unknown>>
            const result = builder.select('id, action')
            expect(typeof result.eq).toBe('function')
            expect(typeof result.order).toBe('function')
        })

        it('.eq() returns chainable builder', () => {
            const builder = serverSupabase.from('audit_logs') as Record<string, (...args: unknown[]) => Record<string, unknown>>
            const result = builder.select('*').eq('action', 'CREATE')
            expect(typeof result.order).toBe('function')
            expect(typeof result.limit).toBe('function')
        })

        it('.order() returns chainable builder with .range()', () => {
            const builder = serverSupabase.from('audit_logs') as Record<string, (...args: unknown[]) => Record<string, unknown>>
            const result = builder.select('*').order('createdAt', { ascending: false })
            // THIS is the exact chain that caused the crash
            expect(typeof result.range).toBe('function')
        })

        it('.order().range() chain works (the exact bug pattern)', () => {
            const builder = serverSupabase.from('audit_logs') as Record<string, (...args: unknown[]) => Record<string, unknown>>
            const result = builder
                .select('id, action, createdAt', { count: 'exact' })
                .order('createdAt', { ascending: false })
                .range(0, 49)
            // Should return thenable (not crash)
            expect(typeof result.then).toBe('function')
        })

        it('.eq().eq().order().range() multi-filter chain works', () => {
            const builder = serverSupabase.from('audit_logs') as Record<string, (...args: unknown[]) => Record<string, unknown>>
            const result = builder
                .select('*', { count: 'exact' })
                .eq('action', 'CREATE')
                .eq('entity', 'user')
                .order('createdAt', { ascending: false })
                .range(0, 9)
            expect(typeof result.then).toBe('function')
        })
    })

    describe('Known unimplemented methods (documented gaps)', () => {
        for (const method of KNOWN_UNIMPLEMENTED) {
            it(`.${method}() is NOT implemented (expected)`, () => {
                const builder = serverSupabase.from('audit_logs')
                expect(typeof builder[method]).not.toBe('function')
            })
        }
    })

    describe('Table mapping coverage', () => {
        for (const table of APP_TABLES) {
            it(`table "${table}" is mapped in ServerQueryBuilder`, () => {
                const builder = serverSupabase.from(table)
                // Should return ServerQueryBuilder (has .select)
                expect(typeof builder.select).toBe('function')
                // ServerQueryBuilder won't have 'abortSignal' (Supabase-only)
                expect(typeof builder.abortSignal).not.toBe('function')
            })
        }
    })
})
