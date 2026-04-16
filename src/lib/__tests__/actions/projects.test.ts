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

import {
    getProjects, getProject,
    updateProjectState, createPhase, deletePhase, createTask, deleteTask,
} from '@/lib/actions/projects'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }

beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
})

// ================================================================

describe('getProjects', () => {
    it('returns projects', async () => {
        set([{ id: 'P1', name: 'Villa' }])
        const r = await getProjects()
        expect(Array.isArray(r)).toBe(true)
    })
    it('returns []', async () => {
        set(null)
        expect(await getProjects()).toEqual([])
    })
})

describe('getProject', () => {
    it('returns project', async () => {
        set({ id: 'P1', name: 'Villa' })
        expect(await getProject('P1')).toHaveProperty('id', 'P1')
    })
    it('returns null', async () => {
        set(null)
        expect(await getProject('X')).toBeNull()
    })
})

describe('updateProjectState', () => {
    it('updates', async () => {
        set({ id: 'P1', state: 'PAUSED' })
        expect((await updateProjectState('P1', 'PAUSED')).success).toBe(true)
    })
    it('fails', async () => {
        set(null, { message: 'Error' })
        expect((await updateProjectState('P1', 'X')).success).toBe(false)
    })
})

describe('createPhase', () => {
    it('creates with valid data', async () => {
        set({ id: 'PH1', name: 'Concept' })
        const r = await createPhase({ name: 'Concept', projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createPhase({})).success).toBe(false)
    })
})

describe('deletePhase', () => {
    it('deletes', async () => {
        set(null, null)
        expect((await deletePhase('PH1')).success).toBe(true)
    })
})

describe('createTask', () => {
    it('creates with valid data', async () => {
        set({ id: 'T1', name: 'Floor plan' })
        const r = await createTask({
            name: 'Floor plan',
            projectId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            phaseId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        })
        expect(r.success).toBe(true)
    })
    it('fails validation', async () => {
        expect((await createTask({})).success).toBe(false)
    })
})

describe('deleteTask', () => {
    it('deletes', async () => {
        set(null, null)
        expect((await deleteTask('T1')).success).toBe(true)
    })
    it('fails', async () => {
        set(null, { message: 'FK' })
        expect((await deleteTask('T1')).success).toBe(false)
    })
})
