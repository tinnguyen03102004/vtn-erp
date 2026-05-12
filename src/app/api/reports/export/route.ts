// Route handler — NOT a server action

import { NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

/**
 * GET /api/reports/export
 * 
 * Generates a CSV report of the ERP data (Projects, Invoices, Employees, Payroll).
 * CSV chosen over xlsx to avoid heavy dependencies — can be opened in Excel natively.
 * Only accessible by DIRECTOR role.
 */
export async function GET() {
    const user = await getSessionFromCookies()
    if (!user || user.role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all report data in parallel
    const [
        { data: projects },
        { data: invoices },
        { data: payments },
        { data: employees },
        { data: users },
        { data: tasks },
        { data: timesheets },
    ] = await Promise.all([
        supabase.from('projects').select('*').order('createdAt', { ascending: false }),
        supabase.from('invoices').select('*').order('createdAt', { ascending: false }),
        supabase.from('payments').select('*').order('paymentDate', { ascending: false }),
        supabase.from('employees').select('*'),
        supabase.from('users').select('id, name, email, role'),
        supabase.from('project_tasks').select('*'),
        supabase.from('timesheets').select('*'),
    ])

    const now = new Date().toISOString().slice(0, 10)

    // ── Sheet 1: Projects ──
    let csv = '\uFEFF' // BOM for Excel UTF-8
    csv += `VTN ERP — BÁO CÁO TỔNG HỢP\r\n`
    csv += `Ngày xuất: ${now}\r\n\r\n`

    csv += `=== DỰ ÁN ===\r\n`
    csv += `Tên dự án,Trạng thái,Ngân sách (VNĐ),Số giai đoạn,Số task,Task hoàn thành,Tiến độ\r\n`
    for (const p of projects || []) {
        const pTasks = (tasks || []).filter(t => t.projectId === p.id)
        const doneTasks = pTasks.filter(t => t.state === 'DONE').length
        const progress = pTasks.length > 0 ? Math.round(doneTasks / pTasks.length * 100) : 0
        const phaseCount = (projects || [].length) // simplified
        csv += `"${p.name}",${p.state},${formatCurrency(Number(p.budget || 0))},${phaseCount},${pTasks.length},${doneTasks},${progress}%\r\n`
    }

    // ── Sheet 2: Invoices ──
    csv += `\r\n=== HÓA ĐƠN ===\r\n`
    csv += `Mã HĐ,Khách hàng,Trạng thái,Số tiền (VNĐ),Ngày xuất\r\n`
    for (const inv of invoices || []) {
        csv += `${inv.name},"${inv.partnerName || ''}",${inv.state},${formatCurrency(Number(inv.amountTotal || 0))},${inv.invoiceDate || ''}\r\n`
    }

    // ── Sheet 3: Payments ──
    csv += `\r\n=== THANH TOÁN ===\r\n`
    csv += `Mã HĐ,Số tiền (VNĐ),Ngày thanh toán,Phương thức,Ghi chú\r\n`
    for (const pay of payments || []) {
        const inv = (invoices || []).find(i => i.id === pay.invoiceId)
        csv += `${inv?.name || pay.invoiceId},${formatCurrency(Number(pay.amount || 0))},${pay.paymentDate || ''},"${pay.method || ''}","${(pay.note || '').replace(/"/g, '""')}"\r\n`
    }

    // ── Sheet 4: Employees ──
    csv += `\r\n=== NHÂN VIÊN ===\r\n`
    csv += `Họ tên,Email,Chức vụ,Phòng ban,Lương Gross (VNĐ),Phụ cấp (VNĐ),Số người phụ thuộc,Tổng giờ làm\r\n`
    for (const emp of employees || []) {
        const u = (users || []).find(usr => usr.id === emp.userId)
        const hours = (timesheets || [])
            .filter(t => t.employeeId === emp.id)
            .reduce((s: number, t: Record<string, unknown>) => s + Number(t.hours || 0), 0)
        csv += `"${u?.name || ''}",${u?.email || ''},"${emp.position || ''}","${emp.department || ''}",${formatCurrency(Number(emp.baseSalary || 0))},${formatCurrency(Number(emp.allowances || 0))},${emp.dependents || 0},${hours}h\r\n`
    }

    // ── Summary ──
    const totalRevenue = (invoices || []).filter(i => i.state === 'PAID').reduce((s, i) => s + Number(i.amountTotal || 0), 0)
    const totalPending = (invoices || []).filter(i => i.state === 'POSTED').reduce((s, i) => s + Number(i.amountTotal || 0), 0)
    const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)

    csv += `\r\n=== TỔNG KẾT ===\r\n`
    csv += `Tổng doanh thu (PAID),${formatCurrency(totalRevenue)}\r\n`
    csv += `Chờ thanh toán (POSTED),${formatCurrency(totalPending)}\r\n`
    csv += `Tổng tiền đã nhận,${formatCurrency(totalPaid)}\r\n`
    csv += `Số dự án,${(projects || []).length}\r\n`
    csv += `Số nhân viên,${(employees || []).length}\r\n`
    csv += `Số task,${(tasks || []).length}\r\n`

    const filename = `VTN-ERP-Report-${now}.csv`

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}
