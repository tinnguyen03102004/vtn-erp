import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'
import { canAccessAttachmentEntity, normalizeAttachmentEntityType } from '@/lib/attachment-access'
export async function POST(req: NextRequest) {
    // Auth check via server-side session
    const user = await getSessionFromRequest(req)
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string

    if (!file || !entityType || !entityId) {
        return NextResponse.json({ error: 'Missing file, entityType, or entityId' }, { status: 400 })
    }

    // F-008 Fix: Validate entity type
    const canonicalEntityType = normalizeAttachmentEntityType(entityType)
    if (!canonicalEntityType) {
        return NextResponse.json({ error: `entityType không hợp lệ: ${entityType}` }, { status: 400 })
    }

    if (!canAccessAttachmentEntity(user.role, canonicalEntityType, 'edit')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // F-008 Fix: Validate MIME type
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
    ]
    if (!allowedMimeTypes.includes(file.type)) {
        return NextResponse.json({ error: `Loại file không được hỗ trợ: ${file.type}` }, { status: 400 })
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File quá lớn (tối đa 10MB)' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const storagePath = `${canonicalEntityType}/${entityId}/${Date.now()}-${file.name}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Save metadata
    const { data, error: dbError } = await supabase.from('attachments').insert({
        entityType: canonicalEntityType,
        entityId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath,
        uploadedById: user.id,
    }).select().single()

    if (dbError) {
        // Rollback storage
        await supabase.storage.from('documents').remove([storagePath])
        return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
