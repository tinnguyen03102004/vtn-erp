'use server'

import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'

export interface ProfileData {
    name: string
    email: string
    role: string
    department: string | null
    position: string | null
    phone: string | null
    joinDate: string | null
}

export async function getProfile(): Promise<ActionResult<ProfileData>> {
    const session = await requireAuth()

    const { data: user, error } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('id', session.id)
        .single()

    if (error || !user) return fail('Không tìm thấy thông tin tài khoản')

    const { data: employee } = await supabase
        .from('employees')
        .select('department, position, phone, joinDate')
        .eq('userId', session.id)
        .single()

    return ok({
        name: user.name ?? '',
        email: user.email ?? '',
        role: user.role ?? '',
        department: employee?.department ?? null,
        position: employee?.position ?? null,
        phone: employee?.phone ?? null,
        joinDate: employee?.joinDate ?? null,
    })
}

export async function updateProfile(data: {
    phone?: string
}): Promise<ActionResult<void>> {
    const session = await requireAuth()

    if (data.phone !== undefined) {
        const { error } = await supabase
            .from('employees')
            .update({ phone: data.phone, updatedAt: new Date().toISOString() })
            .eq('userId', session.id)

        if (error) return fail(error.message)
    }

    return ok(undefined)
}
