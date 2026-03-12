import { vi } from 'vitest'

/**
 * Creates a chainable mock for Supabase query builder.
 * Usage:
 *   const { mockFrom, mockChain, setResult } = createQueryMock()
 *   vi.mocked(supabase.from).mockReturnValue(mockChain as any)
 *   setResult([{ id: '1', name: 'Test' }])
 *   // now supabase.from('table').select('*') resolves to { data: [...], error: null }
 */
export function createQueryMock() {
    let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

    const mockChain: Record<string, ReturnType<typeof vi.fn>> = {}

    // All chainable methods return the chain itself
    const chainMethods = [
        'select', 'insert', 'update', 'delete', 'upsert',
        'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is',
        'order', 'limit', 'range', 'match',
    ]

    for (const method of chainMethods) {
        mockChain[method] = vi.fn().mockReturnValue(mockChain)
    }

    // Terminal methods resolve the promise
    mockChain.single = vi.fn().mockImplementation(() => Promise.resolve(mockResult))
    mockChain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(mockResult))

    // Make the chain itself thenable (for queries without .single())
    mockChain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
        resolve(mockResult)
        return Promise.resolve(mockResult)
    })

    const mockFrom = vi.fn().mockReturnValue(mockChain)

    return {
        mockFrom,
        mockChain,
        setResult: (data: unknown, error: unknown = null) => {
            mockResult = { data, error }
        },
        setError: (message: string) => {
            mockResult = { data: null, error: { message } }
        },
        reset: () => {
            mockResult = { data: null, error: null }
            for (const method of [...chainMethods, 'single', 'maybeSingle']) {
                mockChain[method].mockClear()
            }
            mockFrom.mockClear()
        },
    }
}

/** Default mock user returned by requirePermission */
export const MOCK_USER = {
    id: 'user-1',
    email: 'test@vtn.com',
    role: 'admin',
    name: 'Test User',
}
