'use client'

import { useState } from 'react'
import Link from 'next/link'
import { importAttendance } from '@/lib/actions/attendance'
import { useToast, ToastContainer } from '@/components/Toast'
import type { ParseResult } from '@/lib/attendance-parser'

interface Period {
    id: string
    name: string
    startDate: string
    endDate: string
    state: string
    employeeCount: number
    totalWorkDays: number
    pendingCount: number
}

const stateLabels: Record<string, { label: string; color: string; icon: string }> = {
    DRAFT: { label: 'Nháp', color: '#8FA3BF', icon: '📝' },
    REVIEW: { label: 'Đang review', color: '#F59E0B', icon: '👁️' },
    LOCKED: { label: 'Đã khóa', color: '#22C55E', icon: '🔒' },
}

export default function AttendanceList({ periods: initialPeriods }: { periods: Period[] }) {
    const { toasts, addToast } = useToast()
    const [periods] = useState(initialPeriods)
    const [showImport, setShowImport] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<ParseResult | null>(null)
    const [importing, setImporting] = useState(false)

    async function handleFileUpload(file: File) {
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/attendance/import', { method: 'POST', body: formData })
            const json = await res.json()

            if (!res.ok || !json.ok) {
                addToast(json.error || 'Upload thất bại', 'error')
                return
            }

            setPreview(json.data)
        } catch {
            addToast('Lỗi khi upload file', 'error')
        } finally {
            setUploading(false)
        }
    }

    async function handleConfirmImport() {
        if (!preview) return
        setImporting(true)
        try {
            const result = await importAttendance(preview)
            if (!result.success) {
                addToast(result.error || 'Import thất bại', 'error')
                return
            }
            addToast(`✅ Import thành công: ${result.data.imported} dòng chấm công`)
            setShowImport(false)
            setPreview(null)
            // Reload page to see new period
            window.location.reload()
        } catch {
            addToast('Lỗi khi import', 'error')
        } finally {
            setImporting(false)
        }
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Chấm công</h1>
                    <p className="page-subtitle">Quản lý kỳ chấm công, import từ máy chấm công</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowImport(true)}>
                        📥 Import Excel
                    </button>
                </div>
            </div>

            {/* Import Modal */}
            {showImport && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', margin: 20 }}>
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F' }}>
                                    📥 Import chấm công từ Excel
                                </h2>
                                <button onClick={() => { setShowImport(false); setPreview(null) }}
                                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8FA3BF' }}>
                                    ✕
                                </button>
                            </div>

                            {!preview ? (
                                <div style={{
                                    border: '2px dashed #CBD5E1', borderRadius: 12, padding: 40,
                                    textAlign: 'center', cursor: 'pointer',
                                    background: uploading ? '#F1F5F9' : '#FAFBFC',
                                }}>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                        style={{ display: 'none' }}
                                        id="attendance-file"
                                        disabled={uploading}
                                    />
                                    <label htmlFor="attendance-file" style={{ cursor: 'pointer' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: '#4A5E78', marginBottom: 4 }}>
                                            {uploading ? '⏳ Đang xử lý...' : 'Chọn file Excel từ máy chấm công'}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#8FA3BF' }}>
                                            Hỗ trợ .xlsx, .xls — Mỗi sheet = 1 nhân viên
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        background: '#F0F9FF', border: '1px solid #BAE6FD',
                                        borderRadius: 8, padding: 16, marginBottom: 16,
                                    }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0369A1', marginBottom: 8 }}>
                                            ✅ Kết quả parse
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#4A5E78' }}>
                                            <div>📅 Kỳ: <strong>{preview.periodName}</strong></div>
                                            <div>👥 Nhân viên: <strong>{preview.sheets.length}</strong></div>
                                            <div>📋 Tổng dòng: <strong>{preview.sheets.reduce((s, sh) => s + sh.rows.length, 0)}</strong></div>
                                            <div>📆 {preview.startDate} → {preview.endDate}</div>
                                        </div>
                                    </div>

                                    {preview.warnings.length > 0 && (
                                        <div style={{
                                            background: '#FFF7ED', border: '1px solid #FDBA74',
                                            borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12,
                                        }}>
                                            <strong style={{ color: '#C2410C' }}>⚠️ Cảnh báo:</strong>
                                            {preview.warnings.map((w, i) => (
                                                <div key={i} style={{ color: '#9A3412', marginTop: 4 }}>• {w}</div>
                                            ))}
                                        </div>
                                    )}

                                    <table className="data-table" style={{ fontSize: 13 }}>
                                        <thead>
                                            <tr>
                                                <th>Nhân viên</th>
                                                <th style={{ textAlign: 'center' }}>Mã máy</th>
                                                <th style={{ textAlign: 'center' }}>Ngày công</th>
                                                <th style={{ textAlign: 'center' }}>Giờ TB</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.sheets.map((sheet, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{sheet.employeeName}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{
                                                            background: '#E2E8F0', padding: '2px 8px',
                                                            borderRadius: 4, fontSize: 11, fontWeight: 600,
                                                        }}>{sheet.machineId}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{sheet.totalWorkDays}</td>
                                                    <td style={{ textAlign: 'center' }}>{sheet.avgHours}h</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                                        <button className="btn btn-sm" onClick={() => setPreview(null)}>
                                            ← Chọn file khác
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={handleConfirmImport} disabled={importing}>
                                            {importing ? '⏳ Đang import...' : '✅ Xác nhận Import'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Periods List */}
            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kỳ chấm công</th>
                            <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ textAlign: 'center' }}>Nhân viên</th>
                            <th style={{ textAlign: 'center' }}>Bổ sung chờ duyệt</th>
                            <th style={{ textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periods.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: '#8FA3BF', padding: 40 }}>
                                    Chưa có kỳ chấm công nào. Nhấn &quot;Import Excel&quot; để bắt đầu.
                                </td>
                            </tr>
                        )}
                        {periods.map((p) => {
                            const state = stateLabels[p.state] || stateLabels.DRAFT
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#1F3A5F' }}>{p.name}</div>
                                        <div style={{ fontSize: 11, color: '#8FA3BF' }}>
                                            {p.startDate} → {p.endDate}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            background: state.color + '15', color: state.color,
                                            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                        }}>
                                            {state.icon} {state.label}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.employeeCount}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {p.pendingCount > 0 ? (
                                            <span style={{
                                                background: '#FEF3C7', color: '#D97706',
                                                padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                                            }}>{p.pendingCount} chờ</span>
                                        ) : (
                                            <span style={{ color: '#CBD5E1' }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/attendance/${p.id}`} className="btn btn-sm">
                                            Xem chi tiết →
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    )
}
