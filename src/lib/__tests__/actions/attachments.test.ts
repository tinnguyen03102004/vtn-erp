import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUser = { id: 'user-1', email: 'test@vtn.com', role: 'DIRECTOR', name: 'Test' }
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
const mockUpload = vi.fn(() => Promise.resolve({ error: null }))
const mockRemove = vi.fn(() => Promise.resolve({ error: null }))

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: (t: string) => mockFrom(t),
        storage: {
            from: () => ({ upload: mockUpload, remove: mockRemove }),
        },
    },
}))
vi.mock('@/lib/auth-guard', () => ({
    requireAuth: () => Promise.resolve(mockUser),
    requirePermission: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))
vi.mock('@/lib/attachment-access', () => ({
    getAttachmentEntityTypesForRead: (t: string) => [t],
    getAttachmentPermission: () => 'crm.view',
    normalizeAttachmentEntityType: (t: string) => t,
}))

import { getAttachments, uploadAttachment, deleteAttachment } from '@/lib/actions/attachments'

function set(data: unknown, error: unknown = null) { mockResult = { data, error } }
beforeEach(() => {
    mockResult = { data: null, error: null }
    mockChain = createMockChain()
    mockFrom.mockImplementation(() => mockChain)
    mockUpload.mockReset().mockResolvedValue({ error: null })
    mockRemove.mockReset().mockResolvedValue({ error: null })
})

describe('getAttachments', () => {
    it('returns attachments list', async () => {
        set([{ id: 'a1', fileName: 'test.pdf' }])
        const result = await getAttachments('lead', 'L1')
        expect(result).toHaveLength(1)
    })
    it('returns empty', async () => {
        set(null)
        expect(await getAttachments('lead', 'L1')).toEqual([])
    })
})

describe('uploadAttachment', () => {
    it('rejects unsupported file type', async () => {
        const r = await uploadAttachment({
            entityType: 'lead', entityId: 'L1',
            fileName: 'virus.exe', fileType: 'application/x-msdownload',
            fileSize: 1000, fileBase64: 'dGVzdA==',
        })
        expect(r.success).toBe(false)
        expect(r.error).toContain('không được hỗ trợ')
    })

    it('rejects oversized file', async () => {
        const r = await uploadAttachment({
            entityType: 'lead', entityId: 'L1',
            fileName: 'huge.pdf', fileType: 'application/pdf',
            fileSize: 20 * 1024 * 1024, fileBase64: 'dGVzdA==',
        })
        expect(r.success).toBe(false)
        expect(r.error).toContain('quá lớn')
    })

    it('uploads valid file', async () => {
        set({ id: 'att-1', fileName: 'doc.pdf' })
        const r = await uploadAttachment({
            entityType: 'lead', entityId: 'L1',
            fileName: 'doc.pdf', fileType: 'application/pdf',
            fileSize: 5000, fileBase64: 'dGVzdA==',
        })
        expect(r.success).toBe(true)
    })
})

describe('deleteAttachment', () => {
    it('deletes existing attachment', async () => {
        set({ storagePath: 'lead/L1/doc.pdf', entityType: 'lead', entityId: 'L1' })
        const r = await deleteAttachment('att-1')
        expect(r.success).toBe(true)
    })
    it('fails when not found', async () => {
        set(null)
        const r = await deleteAttachment('bad')
        expect(r.success).toBe(false)
    })
})
