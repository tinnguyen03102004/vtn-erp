'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { logAudit } from '@/lib/audit'

// ââ Allowed file types & size limits ââ
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ââ Types ââ
export interface UploadAttachmentInput {
    entityType: 'lead' | 'order' | 'project' | 'invoice' | 'employee'
    entityId: string
    fileName: string
    fileType: string
    fileSize: number
    fileBase64: string  // base64-encoded file content
}

// ââ Read ââ
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

// ââ Upload ââ
export async function uploadAttachment(input: UploadAttachmentInput): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requireAuth()

    // Validate file type
    if (!ALLOWED_TYPES.includes(input.fileType)) {
        return fail(`Loáº¡i file khÃ´ng ÄÆ°á»£c há»- trá»£: ${input.fileType}`)
    }

    // Validate file size
    if (input.fileSize > MAX_FILE_SIZE) {
        return fail(`File quÃ¡ lá»n. Tá»i Äa ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Upload to Supabase Storage
    const storagePath = `${input.entityType}/${input.entityId}/${Date.now()}-${input.fileName}`
    const fileBuffer = Buffer.from(input.fileBase64, 'base64')

    const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, { contentType: input.fileType })
    if (uploadErr) return fail(`Upload tháº¥t báº¡i: ${uploadErr.message}`)

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
        return fail(`LÆ°u metadata tháº¥t báº¡i: ${dbErr.message}`)
    }

    await logAudit({
        userId: user.id, action: 'create', entity: 'attachment',
        entityId: data.id, details: `Upload ${input.fileName} â ${input.entityType}/${input.entityId}`,
    })
    return ok(data)
}

// ââ Delete ââ
export async function deleteAttachment(id: string): Promise<ActionResult<void>> {
    const user = await requireAuth()

    const { data: attachment } = await supabase
        .from('attachments')
        .select('storagePath, entityType, entityId')
        .eq('id', id)
        .single()

    if (!attachment) return fail('Attachment khÃ´ng tá»n táº¡i')

    // Delete from storage
    await supabase.storage.from('documents').remove([attachment.storagePath])

    // Delete from DB
    const { error } = await supabase.from('attachments').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAudit({
        userId: user.id, action: 'delete', entity: 'attachment',
        entityId: id, details: `XÃ³a file tá»« ${attachment.entityType}/${attachment.entityId}`,
    })
    return ok(undefined as void)
}
