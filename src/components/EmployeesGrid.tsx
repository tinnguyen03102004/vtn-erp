'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { createEmployee, updateEmployee } from '@/lib/actions/employees'
import { useToast, ToastContainer } from '@/components/Toast'

const roleLabels: Record<string, { label: string; badge: string }> = {
    DIRECTOR: { label: 'GiÃ¡m Äá»c', badge: 'primary' },
    PROJECT_MANAGER: { label: 'Quáº£n lÃ½ DA', badge: 'info' },
    ARCHITECT: { label: 'Kiáº¿n trÃºc sÆ°', badge: 'accent' },
    FINANCE: { label: 'Káº¿ toÃ¡n', badge: 'success' },
    SALES: { label: 'Kinh doanh', badge: 'warning' },
}
const avatarColors = ['#1F3A5F', '#2A4D7F', '#C9A84C', '#22C55E', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6']

function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EmployeesGrid({ initialEmployees }: { initialEmployees: any[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [employees, setEmployees] = useState(initialEmployees)
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const editEmp = editId ? employees.find(e => e.id === editId) : null

    async function handleSubmit(fd: FormData) {
        const data = {
            name: fd.get('name') as string,
            email: fd.get('email') as string,
            role: fd.get('role') as string,
            department: fd.get('department') as string,
            position: fd.get('position') as string,
            phone: fd.get('phone') as string,
        }
        if (!data.name || !data.email) { addToast('TÃªn vÃ  email báº¯t buá»c', 'error'); return }
        setSaving(true)
        try {
            if (editId) {
                await updateEmployee(editId, data)
                addToast('ÄÃ£ cáº­p nháº­t nhÃ¢n viÃªn')
            } else {
                const newEmp = await createEmployee(data)
                setEmployees(prev => [...prev, newEmp])
                addToast(`ÄÃ£ thÃªm ${data.name}`)
            }
            setShowModal(false)
            setEditId(null)
            router.refresh()
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lá»-i', 'error') }
        finally { setSaving(false) }
    }

    const deptCounts: Record<string, number> = {}
    for (const e of employees) { deptCounts[e.department || 'KhÃ¡c'] = (deptCounts[e.department || 'KhÃ¡c'] || 0) + 1 }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">NhÃ¢n viÃªn</h1>
                    <p className="page-subtitle">{employees.length} nhÃ¢n sá»± táº¡i Cty TNHH VÃµ Trá»ng NghÄ©a</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setShowModal(true) }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        ThÃªm nhÃ¢n viÃªn
                    </button>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tá»ng nhÃ¢n sá»±', count: employees.length, icon: 'ð¥' },
                    { label: 'Kiáº¿n trÃºc', count: deptCounts['Kiáº¿n trÃºc'] || 0, icon: 'ðï¸' },
                    { label: 'Kinh doanh', count: deptCounts['Kinh doanh'] || 0, icon: 'ð¼' },
                    { label: 'Káº¿ toÃ¡n', count: deptCounts['Káº¿ toÃ¡n'] || 0, icon: 'ð' },
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {employees.map((emp, idx) => {
                    const roleInfo = roleLabels[emp.user?.role] || { label: emp.user?.role || 'â', badge: 'muted' }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const hoursThisMonth = (emp.timesheets || []).reduce((s: number, t: any) => s + t.hours, 0)
                    const utilizationRate = Math.round(hoursThisMonth / 168 * 100)
                    const color = avatarColors[idx % avatarColors.length]
                    return (
                        <div key={emp.id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onClick={() => { setEditId(emp.id); setShowModal(true) }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <div className="avatar avatar-lg" style={{ background: color }}>{getInitials(emp.user?.name ?? '')}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F1C2E', marginBottom: 2 }}>{emp.user?.name}</div>
                                    <div style={{ fontSize: 12, color: '#8FA3BF', marginBottom: 6 }}>{emp.position}</div>
                                    <span className={`badge badge-${roleInfo.badge}`}>{roleInfo.label}</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                                    <span style={{ color: '#8FA3BF' }}>Utilization</span>
                                    <span style={{ fontWeight: 700, color: utilizationRate >= 85 ? '#22C55E' : utilizationRate >= 65 ? '#C9A84C' : '#EF4444' }}>
                                        {hoursThisMonth}h ({utilizationRate}%)
                                    </span>
                                </div>
                                <div className="progress">
                                    <div className="progress-bar" style={{
                                        width: `${Math.min(100, utilizationRate)}%`,
                                        background: utilizationRate >= 85 ? '#22C55E' : utilizationRate >= 65 ? '#C9A84C' : '#EF4444',
                                    }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8FA3BF', borderTop: '1px solid #F0F2F5', paddingTop: 12 }}>
                                <div>{emp.user?.email}</div>
                                <div>ð {emp.joinDate ? formatDate(String(emp.joinDate).split('T')[0]) : 'â'}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => { setShowModal(false); setEditId(null) }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F1C2E' }}>{editId ? 'Sá»­a nhÃ¢n viÃªn' : 'ThÃªm nhÃ¢n viÃªn'}</h2>
                            <button onClick={() => { setShowModal(false); setEditId(null) }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>â</button>
                        </div>
                        <form action={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Há» tÃªn *</label>
                                        <input className="form-input" name="name" defaultValue={editEmp?.user?.name ?? ''} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input className="form-input" name="email" type="email" defaultValue={editEmp?.user?.email ?? ''} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Chá»©c vá»¥</label>
                                        <input className="form-input" name="position" defaultValue={editEmp?.position ?? ''} placeholder="VD: KTS trÆ°á»ng" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">PhÃ²ng ban</label>
                                        <select className="form-input" name="department" defaultValue={editEmp?.department ?? ''}>
                                            <option value="">â Chá»n â</option>
                                            <option>Ban GiÃ¡m Äá»c</option>
                                            <option>Kiáº¿n trÃºc</option>
                                            <option>Kinh doanh</option>
                                            <option>Káº¿ toÃ¡n</option>
                                            <option>NhÃ¢n sá»±</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <select className="form-input" name="role" defaultValue={editEmp?.user?.role ?? 'ARCHITECT'}>
                                            <option value="DIRECTOR">GiÃ¡m Äá»c</option>
                                            <option value="PROJECT_MANAGER">Quáº£n lÃ½ DA</option>
                                            <option value="ARCHITECT">Kiáº¿n trÃºc sÆ°</option>
                                            <option value="FINANCE">Káº¿ toÃ¡n</option>
                                            <option value="SALES">Kinh doanh</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SÄT</label>
                                        <input className="form-input" name="phone" defaultValue={editEmp?.phone ?? ''} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditId(null) }}>Huá»·</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'â³' : editId ? 'ð¾ Cáº­p nháº­t' : 'ThÃªm'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
