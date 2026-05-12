'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { createEmployee, updateEmployee } from '@/lib/actions/employees'
import { updateEmployeeSalary } from '@/lib/actions/payroll'
import { useToast, ToastContainer } from '@/components/Toast'

const roleLabels: Record<string, { label: string; badge: string }> = {
    DIRECTOR: { label: 'Giám đốc', badge: 'primary' },
    PROJECT_MANAGER: { label: 'Quản lý DA', badge: 'info' },
    ARCHITECT: { label: 'Kiến trúc sư', badge: 'accent' },
    FINANCE: { label: 'Kế toán', badge: 'success' },
    SALES: { label: 'Kinh doanh', badge: 'warning' },
}
const avatarColors = ['#1F3A5F', '#2A4D7F', '#C9A84C', '#22C55E', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6']

function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EmployeesGrid({ initialEmployees, canManageEmployees }: { initialEmployees: any[]; canManageEmployees: boolean }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [employees, setEmployees] = useState(initialEmployees)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [salaryEmpId, setSalaryEmpId] = useState<string | null>(null)

    const editEmp = editId ? employees.find(e => e.id === editId) : null

    async function handleSubmit(fd: FormData) {
        if (!canManageEmployees) {
            addToast('Bạn không có quyền chỉnh sửa nhân viên', 'error')
            return
        }

        const data = {
            name: fd.get('name') as string,
            email: fd.get('email') as string,
            role: fd.get('role') as string,
            department: fd.get('department') as string,
            position: fd.get('position') as string,
            phone: fd.get('phone') as string,
            machineCode: fd.get('machineCode') as string || '',
        }
        if (!data.name || !data.email) { addToast('Tên và email bắt buộc', 'error'); return }
        setSaving(true)
        try {
            if (editId) {
                const result = await updateEmployee(editId, data)
                if ('success' in result && !result.success) {
                    addToast(result.error || 'Cập nhật thất bại', 'error'); return
                }
                addToast('Đã cập nhật nhân viên')
            } else {
                const result = await createEmployee(data)
                if ('success' in result && !result.success) {
                    addToast(result.error || 'Thêm thất bại', 'error'); return
                }
                const newEmp = 'data' in result ? result.data : result
                setEmployees(prev => [...prev, newEmp])
                addToast(`Đã thêm ${data.name}`)
            }
            setShowModal(false)
            setEditId(null)
            router.refresh()
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lỗi', 'error') }
        finally { setSaving(false) }
    }

    const salaryEmp = salaryEmpId ? employees.find(e => e.id === salaryEmpId) : null

    async function handleSalarySubmit(fd: FormData) {
        if (!salaryEmpId) return
        setSaving(true)
        try {
            const data = {
                baseSalary: Number(fd.get('baseSalary') || 0),
                insurableSalary: Number(fd.get('insurableSalary') || 0),
                region: Number(fd.get('region') || 1),
                dependents: Number(fd.get('dependents') || 0),
                allowances: Number(fd.get('allowances') || 0),
            }
            if (data.baseSalary <= 0) { addToast('Lương cơ bản phải > 0', 'error'); return }
            const result = await updateEmployeeSalary(salaryEmpId, data)
            if ('success' in result && !result.success) {
                addToast(result.error || 'Cập nhật lương thất bại', 'error'); return
            }
            addToast('Đã cập nhật lương nhân viên')
            setSalaryEmpId(null)
            router.refresh()
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lỗi', 'error') }
        finally { setSaving(false) }
    }

    const deptCounts: Record<string, number> = {}
    for (const e of employees) { deptCounts[e.department || 'Khác'] = (deptCounts[e.department || 'Khác'] || 0) + 1 }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Nhân viên</h1>
                    <p className="page-subtitle">{employees.length} nhân sự tại Cty TNHH Võ Trọng Nghĩa</p>
                </div>
                {canManageEmployees && <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setShowModal(true) }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Thêm nhân viên
                    </button>
                </div>}
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tổng nhân sự', count: employees.length, icon: '👥' },
                    { label: 'Kiến trúc', count: deptCounts['Kiến trúc'] || 0, icon: '🏛️' },
                    { label: 'Ban Giám đốc', count: deptCounts['Ban Giám đốc'] || 0, icon: '🏢' },
                    { label: 'Kế toán', count: deptCounts['Kế toán'] || 0, icon: '📊' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-label">{k.label}</div>
                                <div className="kpi-value" style={{ fontSize: 28, marginTop: 4 }}>{k.count}</div>
                            </div>
                            <div style={{ fontSize: 28 }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {employees.map((emp, idx) => {
                    const roleInfo = roleLabels[emp.user?.role] || { label: emp.user?.role || '—', badge: 'muted' }
                    const color = avatarColors[idx % avatarColors.length]
                    const name = emp.user?.name || '—'
                    return (
                        <div
                            key={emp.id}
                            className="card"
                            style={{
                                padding: 0,
                                cursor: canManageEmployees ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                overflow: 'hidden',
                                textAlign: 'center',
                            }}
                            onClick={() => {
                                if (!canManageEmployees) return
                                setEditId(emp.id)
                                setShowModal(true)
                            }}
                        >
                            {/* Avatar Section */}
                            <div style={{
                                padding: '24px 16px 16px',
                                background: `linear-gradient(135deg, ${color}22, ${color}08)`,
                            }}>
                                <div
                                    className="avatar"
                                    style={{
                                        background: color,
                                        width: 72,
                                        height: 72,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#fff',
                                        border: '3px solid rgba(255,255,255,0.6)',
                                        boxShadow: `0 4px 12px ${color}40`,
                                    }}
                                >
                                    {getInitials(name)}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F1C2E', marginBottom: 2 }}>
                                    {name}
                                </div>
                                <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 8 }}>
                                    {emp.position || '—'}
                                </div>
                                <span className={`badge badge-${roleInfo.badge}`}>{roleInfo.label}</span>
                            </div>

                            {/* Info Section */}
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #F0F2F5' }}>
                                <div style={{ fontSize: 11, color: '#8FA3BF', marginBottom: 4 }}>
                                    {emp.user?.email}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8FA3BF' }}>
                                    <span>📅 {emp.joinDate ? formatDate(String(emp.joinDate).split('T')[0]) : '—'}</span>
                                    {emp.machineCode && (
                                        <span style={{
                                            background: '#E2E8F0', padding: '1px 6px',
                                            borderRadius: 4, fontSize: 10, fontWeight: 600, color: '#4A5E78',
                                        }}>🔢 {emp.machineCode}</span>
                                    )}
                                </div>
                            </div>

                            {/* Salary row for managers */}
                            {canManageEmployees && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 16px',
                                    borderTop: '1px solid #F0F2F5',
                                    fontSize: 11,
                                }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ fontSize: 11, padding: '2px 8px' }}
                                        onClick={(e) => { e.stopPropagation(); setSalaryEmpId(emp.id) }}
                                    >
                                        💰 Lương
                                    </button>
                                    <span style={{ color: Number(emp.baseSalary || 0) > 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                                        {Number(emp.baseSalary || 0) > 0 ? formatCurrency(Number(emp.baseSalary)) : 'Chưa cài'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Edit Modal */}
            {canManageEmployees && showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => { setShowModal(false); setEditId(null) }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E' }}>{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
                            <button onClick={() => { setShowModal(false); setEditId(null) }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>✕</button>
                        </div>
                        <form action={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Họ tên *</label>
                                        <input className="form-input" name="name" defaultValue={editEmp?.user?.name ?? ''} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input className="form-input" name="email" type="email" defaultValue={editEmp?.user?.email ?? ''} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Chức vụ</label>
                                        <input className="form-input" name="position" defaultValue={editEmp?.position ?? ''} placeholder="VD: KTS trưởng" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phòng ban</label>
                                        <select className="form-input" name="department" defaultValue={editEmp?.department ?? ''}>
                                            <option value="">— Chọn —</option>
                                            <option>Ban Giám đốc</option>
                                            <option>Kiến trúc</option>
                                            <option>Kế toán</option>
                                            <option>Nhân sự</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-input" name="role" defaultValue={editEmp?.user?.role ?? 'ARCHITECT'}>
                                            <option value="DIRECTOR">Giám đốc</option>
                                            <option value="PROJECT_MANAGER">Quản lý DA</option>
                                            <option value="ARCHITECT">Kiến trúc sư</option>
                                            <option value="FINANCE">Kế toán</option>
                                            <option value="SALES">Kinh doanh</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SĐT</label>
                                        <input className="form-input" name="phone" defaultValue={editEmp?.phone ?? ''} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mã máy chấm công</label>
                                    <input className="form-input" name="machineCode" defaultValue={editEmp?.machineCode ?? ''} placeholder="VD: 364 (ID trên máy chấm công)" />
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>Nhập mã nhân viên trên máy chấm công để liên kết dữ liệu chấm công</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditId(null) }}>Huỷ</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : editId ? '💾 Cập nhật' : 'Thêm'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Modal */}
            {canManageEmployees && salaryEmpId && salaryEmp && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setSalaryEmpId(null)}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E', margin: 0 }}>💰 Cài đặt lương</h2>
                                <div style={{ fontSize: 13, color: '#8FA3BF', marginTop: 4 }}>{salaryEmp.user?.name} — {salaryEmp.position || 'Chưa có chức vụ'}</div>
                            </div>
                            <button onClick={() => setSalaryEmpId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>✕</button>
                        </div>
                        <form action={handleSalarySubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Lương gross (VND/tháng) *</label>
                                    <input className="form-input" name="baseSalary" type="number" defaultValue={Number(salaryEmp.baseSalary || 0)} min={0} step={100000} required />
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>Lương cơ bản hàng tháng trước thuế</div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lương đóng BHXH (VND)</label>
                                    <input className="form-input" name="insurableSalary" type="number" defaultValue={Number(salaryEmp.insurableSalary || 0)} min={0} step={100000} />
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>Để 0 = bằng lương gross</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Vùng lương</label>
                                        <select className="form-input" name="region" defaultValue={Number(salaryEmp.region || 1)}>
                                            <option value={1}>Vùng 1 (TP.HCM, Hà Nội)</option>
                                            <option value={2}>Vùng 2</option>
                                            <option value={3}>Vùng 3</option>
                                            <option value={4}>Vùng 4</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Người phụ thuộc</label>
                                        <input className="form-input" name="dependents" type="number" defaultValue={Number(salaryEmp.dependents || 0)} min={0} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phụ cấp (VND/tháng)</label>
                                    <input className="form-input" name="allowances" type="number" defaultValue={Number(salaryEmp.allowances || 0)} min={0} step={100000} />
                                    <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 2 }}>Phụ cấp ăn trưa, xăng xe, điện thoại…</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSalaryEmpId(null)}>Huỷ</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳' : '💾 Lưu lương'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
