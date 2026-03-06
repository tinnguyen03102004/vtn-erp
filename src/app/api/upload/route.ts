import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    // Auth check
    const cookieStore = await cookies()
    const session = cookieStore.get('vtn-session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let user: any
    try {
        user = JSON.parse(Buffer.from(session, 'base64').toString())
    } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entityType') as string
    const entityId = formData.get('entityId') as string

    if (!file || !entityType || !entityId) {
        return NextResponse.json({ error: 'Missing file, entityType, or entityId' }, { status: 400 })
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File quá lớn (tối đa 10MB)' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'bin'
    const storagePath = `${entityType}/${entityId}/${Date.now()}-${file.name}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Save metadata
    const { data, error: dbError } = await supabase.from('attachments').insert({
        entityType,
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
