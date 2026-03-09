'use server'

import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { createEmployeeSchema, updateEmployeeSchema, parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function getEmployees() {
    const { data: employees } = await supabase.from('employees').select('*')
    const { data: users } = await supabase.from('users').select('id, name, email, role')
    const { data: timesheets } = await supabase.from('timesheets').select('employeeId, hours')

    return (employees || []).map((emp) => {
        const user = (users || []).find((u) => u.id === emp.userId) || { name: '', email: '', role: '' }
        const empTimesheets = (timesheets || []).filter((t) => t.employeeId === emp.id)
        return { ...emp, user, timesheets: empTimesheets }
    })
}

export async function getEmployee(id: string) {
    const { data: emp } = await supabase.from('employees').select('*').eq('id', id).single()
    if (!emp) return null

    const { data: user } = await supabase.from('users').select('id, name, email, role').eq('id', emp.userId).single()
    return { ...emp, user }
}

export async function createEmployee(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('hr.edit')
    const parsed = parseInput(createEmployeeSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    // Step 1: Create user
    const { data: newUser, error: userErr } = await supabase.from('users').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role || 'ARCHITECT',
        password: parsed.data.password || null,
    } as any).select().single()
    if (userErr) return fail(userErr.message)

    // Step 2: Create employee record (rollback user on failure)
    const { data: emp, error: empErr } = await supabase.from('employees').insert({
        userId: newUser.id,
        department: parsed.data.department || null,
        position: parsed.data.position || null,
        phone: parsed.data.phone || null,
        joinDate: parsed.data.joinDate || new Date().toISOString(),
    } as any).select().single()
    if (empErr) {
        // Compensating rollback: delete orphaned user
        await supabase.from('users').delete().eq('id', newUser.id)
        return fail(`Tạo nhân viên thất bại: ${empErr.message}`)
    }

    await logAudit({ userId: user.id, action: 'create', entity: 'employee', entityId: emp.id, details: `Tạo nhân viên: ${parsed.data.name}` })
    return ok({ ...emp, user: newUser })
}

export async function updateEmployee(id: string, formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('hr.edit')
    const parsed = parseInput(updateEmployeeSchema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data: emp } = await supabase.from('employees').select('userId').eq('id', id).single()
    if (!emp) return fail('Nhân viên không tồn tại')

    // Update user
    await supabase.from('users').update({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
    } as any).eq('id', emp.userId)

    // Update employee
    const { data, error } = await supabase.from('employees').update({
        department: parsed.data.department || null,
        position: parsed.data.position || null,
        phone: parsed.data.phone || null,
        updatedAt: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) return fail(error.message)

    await logAudit({ userId: user.id, action: 'update', entity: 'employee', entityId: id })
    return ok(data)
}
