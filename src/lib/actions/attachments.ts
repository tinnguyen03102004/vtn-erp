'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'

export async function getAttachments(entityType: string, entityId: string) {
    const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('entityType', entityType)
        .eq('entityId', entityId)
        .order('createdAt', { ascending: false })

    return data || []
}

export async function deleteAttachment(id: string) {
    await requireAuth()

    // Get attachment first
    const { data: attachment } = await supabase
        .from('attachments')
        .select('storagePath')
        .eq('id', id)
        .single()

    if (!attachment) throw new Error('Attachment not found')

    // Delete from storage
    await supabase.storage.from('documents').remove([attachment.storagePath])

    // Delete from DB
    const { error } = await supabase.from('attachments').delete().eq('id', id)
    if (error) throw new Error(error.message)
}


