'use server'

import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/auth-guard'

export async function getUsers() {
    const { data } = await supabase.from('users').select('id, name, email, role, isActive, createdAt').order('name')
    return data || []
}

export async function createUser(formData: any) {
    await requirePermission('users.manage')
    const hashedPassword = await bcrypt.hash(formData.password || '123456', 10)
    const { data, error } = await supabase.from('users').insert({
        name: formData.name,
        email: formData.email,
        role: formData.role || 'ARCHITECT',
        password: hashedPassword,
        isActive: true,
    }).select('id, name, email, role, isActive, createdAt').single()
    if (error) throw new Error(error.message)
    return data
}

export async function updateUser(id: string, formData: any) {
    await requirePermission('users.manage')
    const updates: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        updatedAt: new Date().toISOString(),
    }
    if (formData.isActive !== undefined) updates.isActive = formData.isActive
    if (formData.password) updates.password = await bcrypt.hash(formData.password, 10)

    const { data, error } = await supabase.from('users')
        .update(updates).eq('id', id)
        .select('id, name, email, role, isActive, createdAt').single()
    if (error) throw new Error(error.message)
    return data
}

export async function toggleUserActive(id: string, isActive: boolean) {
    await requirePermission('users.manage')
    const { data, error } = await supabase.from('users')
        .update({ isActive, updatedAt: new Date().toISOString() }).eq('id', id)
        .select('id, name, email, role, isActive, createdAt').single()
    if (error) throw new Error(error.message)
    return data
}
