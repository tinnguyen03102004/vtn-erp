'use server'

import { supabase } from '@/lib/supabase'

export async function getEmployees() {
    const { data: employees } = await supabase.from('employees').select('*')
    const { data: users } = await supabase.from('users').select('id, name, email, role')
    const { data: timesheets } = await supabase.from('timesheets').select('employeeId, hours')

    return (employees || []).map((emp: any) => {
        const user = (users || []).find((u: any) => u.id === emp.userId) || { name: '', email: '', role: '' }
        const empTimesheets = (timesheets || []).filter((t: any) => t.employeeId === emp.id)
        return { ...emp, user, timesheets: empTimesheets }
    })
}

export async function getEmployee(id: string) {
    const { data: emp } = await supabase.from('employees').select('*').eq('id', id).single()
    if (!emp) return null

    const { data: user } = await supabase.from('users').select('id, name, email, role').eq('id', emp.userId).single()
    return { ...emp, user }
}

export async function createEmployee(formData: any) {
    // Create user first
    const { data: user, error: userErr } = await supabase.from('users').insert({
        name: formData.name,
        email: formData.email,
        role: formData.role || 'ARCHITECT',
        password: formData.password || null,
    }).select().single()
    if (userErr) throw new Error(userErr.message)

    // Then create employee record
    const { data: emp, error: empErr } = await supabase.from('employees').insert({
        userId: user.id,
        department: formData.department || null,
        position: formData.position || null,
        phone: formData.phone || null,
        joinDate: formData.joinDate || new Date().toISOString(),
    }).select().single()
    if (empErr) throw new Error(empErr.message)

    return { ...emp, user }
}

export async function updateEmployee(id: string, formData: any) {
    const { data: emp } = await supabase.from('employees').select('userId').eq('id', id).single()
    if (!emp) throw new Error('Employee not found')

    // Update user
    await supabase.from('users').update({
        name: formData.name,
        email: formData.email,
        role: formData.role,
    }).eq('id', emp.userId)

    // Update employee
    const { data, error } = await supabase.from('employees').update({
        department: formData.department || null,
        position: formData.position || null,
        phone: formData.phone || null,
        updatedAt: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw new Error(error.message)

    return data
}
