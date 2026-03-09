'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { createUser, updateUser, toggleUserActive } from '@/lib/actions/users'
import { useToast, ToastContainer } from '@/components/Toast'

const roleLabels: Record<string, { label: string; badge: string }> = {
    DIRECTOR: { label: 'Giám đốc', badge: 'primary' },
    PROJECT_MANAGER: { label: 'Quản lý DA', badge: 'info' },
    ARCHITECT: { label: 'Kiến trúc sư', badge: 'accent' },
    FINANCE: { label: 'Kế toán', badge: 'success' },
    SALES: { label: 'Kinh doanh', badge: 'warning' },
}

export default function UserManagement({ initialUsers }: { initialUsers: any[] }) {
    const router = useRouter()
    const { toasts, addToast } = useToast()
    const [users, setUsers] = useState(initialUsers)
    const [showModal, setShowModal] = useState(false)
    const [editUser, setEditUser] = useState<any>(null)

    async function handleSubmit(fd: FormData) {
        const data = {
            name: fd.get('name') as string,
            email: fd.get('email') as string,
            role: fd.get('role') as string,
            password: fd.get('password') as string || undefined,
        }
        if (!data.name || !data.email) { addToast('Tên và email bắt buộc', 'error'); return }
        try {
            if (editUser) {
                const updated = await updateUser(editUser.id, data)
                setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u))
                addToast('Đã cập nhật')
            } else {
                const newUser = await createUser(data)
                setUsers(prev => [...prev, newUser])
                addToast(`Đã tạo tài khoản ${data.name}`)
            }
            setShowModal(false)
            setEditUser(null)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lỗi', 'error') }
    }

    async function handleToggle(user: any) {
        const action = user.isActive ? 'khoá' : 'mở khoá'
        if (!confirm(`${action} tài khoản "${user.name}"?`)) return
        try {
            const updated = await toggleUserActive(user.id, !user.isActive)
            setUsers(prev => prev.map(u => u.id === user.id ? updated : u))
            addToast(`Đã ${action} tài khoản`)
        } catch (err: unknown) { addToast(err instanceof Error ? err.message : 'Lỗi', 'error') }
    }

    const activeCount = users.filter(u => u.isActive).length

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Quản lý Tài khoản</div>
                    <div style={{ fontSize: 13, color: '#8FA3BF' }}>{activeCount} hoạt động / {users.length} tổng</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditUser(null); setShowModal(true) }}>+ Tạo tài khoản</button>
            </div>

            <table className="data-table" style={{ fontSize: 13 }}>
                <thead><tr><th>Tên</th><th>Email</th><th>Role</th><th>Trạng thái</th><th>Ngày tạo</th><th></th></tr></thead>
                <tbody>
                    {users.map(user => {
                        const roleInfo = roleLabels[user.role] || { label: user.role, badge: 'muted' }
                        return (
                            <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                                <td style={{ fontWeight: 600 }}>{user.name}</td>
                                <td style={{ color: '#4A5E78' }}>{user.email}</td>
                                <td><span className={`badge badge-${roleInfo.badge}`}>{roleInfo.label}</span></td>
                                <td>
                                    <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                                        {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                                    </span>
                                </td>
                                <td style={{ color: '#8FA3BF' }}>{user.createdAt ? formatDate(String(user.createdAt).split('T')[0]) : '—'}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}
                                            onClick={() => { setEditUser(user); setShowModal(true) }}>Sửa</button>
                                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: user.isActive ? '#EF4444' : '#22C55E' }}
                                            onClick={() => handleToggle(user)}>
                                            {user.isActive ? '🔒 Khoá' : '🔓 Mở'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => { setShowModal(false); setEditUser(null) }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 800 }}>{editUser ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}</h2>
                            <button onClick={() => { setShowModal(false); setEditUser(null) }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#8FA3BF' }}>✕</button>
                        </div>
                        <form action={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Họ tên *</label>
                                    <input className="form-input" name="name" defaultValue={editUser?.name ?? ''} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input className="form-input" name="email" type="email" defaultValue={editUser?.email ?? ''} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-input" name="role" defaultValue={editUser?.role ?? 'ARCHITECT'}>
                                        <option value="DIRECTOR">Giám đốc</option>
                                        <option value="PROJECT_MANAGER">Quản lý DA</option>
                                        <option value="ARCHITECT">Kiến trúc sư</option>
                                        <option value="FINANCE">Kế toán</option>
                                        <option value="SALES">Kinh doanh</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{editUser ? 'Mật khẩu mới (bỏ trống = giữ nguyên)' : 'Mật khẩu *'}</label>
                                    <input className="form-input" name="password" type="password" placeholder="••••••••" required={!editUser} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowModal(false); setEditUser(null) }}>Huỷ</button>
                                <button type="submit" className="btn btn-primary">{editUser ? '💾 Cập nhật' : 'Tạo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
