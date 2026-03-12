'use client'

import { useState, useRef, useCallback } from 'react'
import NextImage from 'next/image'
import { deleteAttachment } from '@/lib/actions/attachments'
import { useToast, ToastContainer } from '@/components/Toast'

const FILE_ICONS: Record<string, string> = {
    'application/pdf': 'ð',
    'application/msword': 'ð',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'ð',
    'application/vnd.ms-excel': 'ð',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'ð',
    'image/png': 'ð¼ï¸',
    'image/jpeg': 'ð¼ï¸',
    'image/webp': 'ð¼ï¸',
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getPublicUrl(storagePath: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${base}/storage/v1/object/public/documents/${storagePath}`
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

interface Attachment {
    id: string
    fileName: string
    fileType: string
    fileSize: number
    storagePath: string
    createdAt: string
}

type Props = {
    entityType: string
    entityId: string
    initialFiles?: Attachment[]
}

export default function AttachmentPanel({ entityType, entityId, initialFiles = [] }: Props) {
    const { toasts, addToast } = useToast()
    const [files, setFiles] = useState<Attachment[]>(initialFiles)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewType, setPreviewType] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleUpload = useCallback(async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        setUploading(true)

        for (const file of Array.from(fileList)) {
            if (file.size > 10 * 1024 * 1024) {
                addToast(`"${file.name}" quÃ¡ lá»n (tá»i Äa 10MB)`, 'error')
                continue
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('entityType', entityType)
            formData.append('entityId', entityId)

            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Upload failed')
                setFiles(prev => [data, ...prev])
                addToast(`ÄÃ£ upload "${file.name}"`)
            } catch (err: unknown) {
                addToast(err instanceof Error ? err.message : 'Upload failed', 'error')
            }
        }
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
    }, [entityType, entityId, addToast])

    async function handleDelete(attachment: Attachment) {
        if (!confirm(`XÃ³a file "${attachment.fileName}"?`)) return
        try {
            await deleteAttachment(attachment.id)
            setFiles(prev => prev.filter(f => f.id !== attachment.id))
            addToast('ÄÃ£ xÃ³a file')
        } catch (err: unknown) {
            addToast(err instanceof Error ? err.message : 'Delete failed', 'error')
        }
    }

    function handlePreview(attachment: Attachment) {
        const url = getPublicUrl(attachment.storagePath)
        setPreviewUrl(url)
        setPreviewType(attachment.fileType)
    }

    function handleDownload(attachment: Attachment) {
        const url = getPublicUrl(attachment.storagePath)
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.fileName
        a.target = '_blank'
        a.click()
    }

    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Preview Modal */}
            {previewUrl && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setPreviewUrl(null)}
                >
                    <div style={{ background: '#fff', borderRadius: 16, width: '80vw', maxWidth: 900, height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #E2E8F0' }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Xem tÃ i liá»u</span>
                            <button onClick={() => setPreviewUrl(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#8FA3BF' }}>â</button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            {previewType.startsWith('image/') ? (
                                <NextImage src={previewUrl} alt="Preview" width={800} height={600} unoptimized style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
                            ) : previewType === 'application/pdf' ? (
                                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
                            ) : (
                                <div style={{ textAlign: 'center', padding: 60, color: '#8FA3BF' }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>ð</div>
                                    <p>KhÃ´ng thá» xem trÆ°á»c loáº¡i file nÃ y</p>
                                    <a href={previewUrl} target="_blank" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                                        Táº£i xuá»ng
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>ð TÃ i liá»u ÄÃ­nh kÃ¨m</div>

                {/* Drop Zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragOver ? '#3B82F6' : '#CBD5E1'}`,
                        borderRadius: 12,
                        padding: uploading ? '16px' : '24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? '#EFF6FF' : '#FAFBFC',
                        transition: 'all .2s ease',
                        marginBottom: files.length > 0 ? 16 : 0,
                    }}
                >
                    <input ref={inputRef} type="file" multiple hidden onChange={e => handleUpload(e.target.files)} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" />
                    {uploading ? (
                        <div style={{ color: '#3B82F6', fontWeight: 600, fontSize: 13 }}>â³ Äang upload...</div>
                    ) : (
                        <>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>ð¤</div>
                            <div style={{ fontSize: 13, color: '#4A5E78', fontWeight: 500 }}>KÃ©o tháº£ file hoáº·c <span style={{ color: '#3B82F6', fontWeight: 700 }}>nháº¥n Äá» chá»n</span></div>
                            <div style={{ fontSize: 11, color: '#8FA3BF', marginTop: 4 }}>PDF, Word, Excel, áº¢nh â Tá»i Äa 10MB</div>
                        </>
                    )}
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {files.map(f => (
                            <div key={f.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 10, background: '#F8F9FB',
                                border: '1px solid #E2E8F0',
                            }}>
                                <div style={{ fontSize: 24, flexShrink: 0 }}>{FILE_ICONS[f.fileType] || 'ð'}</div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F1C2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {f.fileName}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8FA3BF' }}>
                                        {formatSize(f.fileSize)} â¢ {formatTime(f.createdAt)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    {(f.fileType.startsWith('image/') || f.fileType === 'application/pdf') && (
                                        <button onClick={() => handlePreview(f)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>ðï¸</button>
                                    )}
                                    <button onClick={() => handleDownload(f)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>â¬ï¸</button>
                                    <button onClick={() => handleDelete(f)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12, color: '#EF4444' }}>ð-ï¸</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
