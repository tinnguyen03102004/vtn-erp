'use server'

import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createUserSchema, updateUserSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function getUsers() {
    const { data } = await supabase.from('users').select('id, name, email, role, isActive, createdAt').order('name')
    return data || []
}

export async function createUser(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const currentUser = await requirePermission('users.manage')
    const parsed = parseInput(createUserSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const hashedPassword = await bcrypt.hash(parsed.data.password || '123456', 10)
    const { data, error } = await supabase.from('users').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role || 'ARCHITECT',
        password: hashedPassword,
        isActive: true,
    }).select('id, name, email, role, isActive, createdAt').single()
    if (error) return fail(error.message)

    await logAudit({ userId: currentUser.id, action: 'create', entity: 'user', entityId: data.id, details: `Tạo user: ${parsed.data.name}` })
    return ok(data)
}

export async function updateUser(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const currentUser = await requirePermission('users.manage')
    const parsed = parseInput(updateUserSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const updates: Record<string, unknown> = {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        updatedAt: new Date().toISOString(),
    }
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive
    if (parsed.data.password) updates.password = await bcrypt.hash(parsed.data.password, 10)

    const { data, error } = await supabase.from('users')
        .update(updates).eq('id', id)
        .select('id, name, email, role, isActive, createdAt').single()
    if (error) return fail(error.message)

    await logAudit({ userId: currentUser.id, action: 'update', entity: 'user', entityId: id })
    return ok(data)
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<ActionResult<Record<string, unknown>>> {
    const currentUser = await requirePermission('users.manage')
    const { data, error } = await supabase.from('users')
        .update({ isActive, updatedAt: new Date().toISOString() }).eq('id', id)
        .select('id, name, email, role, isActive, createdAt').single()
    if (error) return fail(error.message)

    await logAudit({ userId: currentUser.id, action: 'update', entity: 'user', entityId: id, details: `${isActive ? 'Kích hoạt' : 'Khóa'} user` })
    return ok(data)
}
