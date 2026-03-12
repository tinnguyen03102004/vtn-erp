'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { logAudit } from '@/lib/audit'

// ── Allowed file types & size limits ──
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ── Types ──
export interface UploadAttachmentInput {
    entityType: 'lead' | 'order' | 'project' | 'invoice' | 'employee'
    entityId: string
    fileName: string
    fileType: string
    fileSize: number
    fileBase64: string  // base64-encoded file content
}

// ── Read ──
export async function getAttachments(entityType: string, entityId: string) {
    await requireAuth()
    const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('entityType', entityType)
        .eq('entityId', entityId)
        .order('createdAt', { ascending: false })

    return data || []
}

// ── Upload ──
export async function uploadAttachment(input: UploadAttachmentInput): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()

    // Validate file type
    if (!ALLOWED_TYPES.includes(input.fileType)) {
        return fail(`Loại file không được hỗ trợ: ${input.fileType}`)
    }

    // Validate file size
    if (input.fileSize > MAX_FILE_SIZE) {
        return fail(`File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Upload to Supabase Storage
    const storagePath = `${input.entityType}/${input.entityId}/${Date.now()}-${input.fileName}`
    const fileBuffer = Buffer.from(input.fileBase64, 'base64')

    const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, { contentType: input.fileType })
    if (uploadErr) return fail(`Upload thất bại: ${uploadErr.message}`)

    // Save metadata to DB
    const { data, error: dbErr } = await supabase.from('attachments').insert({
        entityType: input.entityType,
        entityId: input.entityId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        storagePath,
        uploadedById: user.id,
    }).select().single()

    if (dbErr) {
        // Rollback: remove uploaded file
        await supabase.storage.from('documents').remove([storagePath])
        return fail(`Lưu metadata thất bại: ${dbErr.message}`)
    }

    await logAudit({
        userId: user.id, action: 'create', entity: 'attachment',
        entityId: data.id, details: `Upload ${input.fileName} → ${input.entityType}/${input.entityId}`,
    })
    return ok(data)
}

// ── Delete ──
export async function deleteAttachment(id: string): Promise<ActionResult<void>> {
    const user = await requireAuth()

    const { data: attachment } = await supabase
        .from('attachments')
        .select('storagePath, entityType, entityId')
        .eq('id', id)
        .single()

    if (!attachment) return fail('Attachment không tồn tại')

    // Delete from storage
    await supabase.storage.from('documents').remove([attachment.storagePath])

    // Delete from DB
    const { error } = await supabase.from('attachments').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({
        userId: user.id, action: 'delete', entity: 'attachment',
        entityId: id, details: `Xóa file từ ${attachment.entityType}/${attachment.entityId}`,
    })
    return ok(undefined as void)
}
