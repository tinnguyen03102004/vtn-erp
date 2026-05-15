'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, X, Send, Loader2, Maximize2, Minimize2, Trash2, ChevronRight, Paperclip, FileText, Image as ImageIcon } from 'lucide-react'
import type { Message, PendingAction } from './chatConstants'
import { loadMessages, saveMessages, WELCOME, QUICK_ACTIONS, S, KEYFRAMES } from './chatConstants'
import ChatMessages from './ChatMessages'

interface AttachedFile {
    name: string
    type: string
    size: number
    content: string // text content or base64
    isImage: boolean
}

const ALLOWED_TYPES = [
    'text/plain', 'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png', 'image/jpeg', 'image/webp',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
    const [fileError, setFileError] = useState('')
    const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const stored = loadMessages()
        setMessages(stored.length > 0 ? stored : [WELCOME])
        setHydrated(true)
    }, [])

    useEffect(() => {
        if (hydrated && messages.length > 0) saveMessages(messages)
    }, [messages, hydrated])

    useEffect(() => {
        if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isOpen, pendingAction])

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
    }, [isOpen])

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileError('')

        if (!ALLOWED_TYPES.includes(file.type)) {
            setFileError('Loại file không hỗ trợ. Chấp nhận: PDF, DOCX, TXT, CSV, PNG, JPG, WEBP')
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setFileError(`File quá lớn (tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
            return
        }

        const isImage = file.type.startsWith('image/')
        const isText = file.type === 'text/plain' || file.type === 'text/csv'

        if (isText) {
            const text = await file.text()
            setAttachedFile({ name: file.name, type: file.type, size: file.size, content: text, isImage: false })
        } else {
            // For images, PDF, DOCX: read as base64
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1] // remove data:...;base64, prefix
                setAttachedFile({ name: file.name, type: file.type, size: file.size, content: base64, isImage })
            }
            reader.readAsDataURL(file)
        }
        // Reset input so same file can be re-selected
        e.target.value = ''
    }, [])

    const sendMessage = async (text?: string) => {
        const msg = text || input
        if (!msg.trim() && !attachedFile) return
        if (isLoading) return

        // Build display message
        let displayContent = msg.trim()
        if (attachedFile) {
            displayContent = displayContent
                ? `📎 ${attachedFile.name}\n\n${displayContent}`
                : `📎 ${attachedFile.name}`
        }

        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: displayContent || '📎 File đính kèm', timestamp: Date.now() }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setInput('')
        const currentFile = attachedFile
        setAttachedFile(null)
        setFileError('')
        setIsLoading(true)
        setPendingAction(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30_000)

        try {
            const payload: Record<string, unknown> = {
                messages: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
            }
            // Attach file data if present
            if (currentFile) {
                payload.attachment = {
                    name: currentFile.name,
                    type: currentFile.type,
                    size: currentFile.size,
                    content: currentFile.content,
                    isImage: currentFile.isImage,
                }
            }

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            })

            const data = await res.json()

            if (data.error) {
                setMessages(prev => [...prev, {
                    id: `err-${Date.now()}`, role: 'assistant',
                    content: `\u274c ${data.error}`, timestamp: Date.now(),
                }])
            } else {
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`, role: 'assistant',
                    content: data.content || '\u274c Không có phản hồi.', timestamp: Date.now(),
                }])
                if (data.pendingAction) setPendingAction(data.pendingAction)
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const errorMsg = err?.name === 'AbortError'
                ? '\u23f1\ufe0f Hết thời gian chờ (30s). Vui lòng thử lại.'
                : '\u274c Có lỗi kết nối. Vui lòng thử lại.'
            setMessages(prev => [...prev, {
                id: `err-${Date.now()}`, role: 'assistant',
                content: errorMsg, timestamp: Date.now(),
            }])
        } finally {
            clearTimeout(timeoutId)
            setIsLoading(false)
        }
    }

    const handleConfirmAction = async () => {
        if (!pendingAction || isLoading) return
        setIsLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30_000)
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
                    confirmAction: { nonce: pendingAction.nonce },
                }),
                signal: controller.signal,
            })
            const data = await res.json()
            setMessages(prev => [...prev, {
                id: `confirm-${Date.now()}`, role: 'assistant',
                content: data.content || data.error || '\u274c Lỗi xác nhận.', timestamp: Date.now(),
            }])
        } catch {
            setMessages(prev => [...prev, {
                id: `err-${Date.now()}`, role: 'assistant',
                content: '\u274c Lỗi kết nối khi xác nhận.', timestamp: Date.now(),
            }])
        } finally {
            clearTimeout(timeoutId)
            setPendingAction(null)
            setIsLoading(false)
        }
    }

    const handleRejectAction = () => {
        setPendingAction(null)
        setMessages(prev => [...prev, {
            id: `reject-${Date.now()}`, role: 'assistant',
            content: '\ud83d\udeab Đã hủy thao tác.', timestamp: Date.now(),
        }])
    }

    const clearHistory = () => {
        setMessages([WELCOME])
        saveMessages([WELCOME])
        setPendingAction(null)
    }

    const panelW = isExpanded ? 520 : 400
    const panelH = isExpanded ? 650 : 520

    return (
        <>
            <style>{KEYFRAMES}</style>

            {/* FAB */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} style={S.fab} aria-label="Mở AI Assistant"
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.3)' }}
                >
                    <Bot size={28} />
                    <span style={S.fabDot} />
                </button>
            )}

            {/* Panel */}
            {isOpen && (
                <div style={S.panel(panelW, panelH)}>
                    {/* Header */}
                    <div style={S.header}>
                        <Bot size={24} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={S.headerTitle}>VTN AI Assistant</p>
                            <p style={S.headerSub}>Trợ lý thông minh — Cty TNHH Võ Trọng Nghĩa</p>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={clearHistory} style={S.headerBtn} title="Xóa lịch sử" aria-label="Xóa lịch sử">
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={S.headerBtn}
                                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                                aria-label={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                            >
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button onClick={() => setIsOpen(false)} style={S.headerBtn} title="Đóng" aria-label="Đóng">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={S.msgArea}>
                        <ChatMessages
                            messages={messages}
                            pendingAction={pendingAction}
                            isLoading={isLoading}
                            onConfirm={handleConfirmAction}
                            onReject={handleRejectAction}
                        />

                        {/* Loading */}
                        {isLoading && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={S.avatar('#f3e8ff')}>
                                    <Loader2 size={16} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                                <div style={{ background: '#f3f4f6', borderRadius: 12, padding: '8px 12px', display: 'flex', gap: 4 }}>
                                    <span style={S.loadingDot(0)} />
                                    <span style={S.loadingDot(150)} />
                                    <span style={S.loadingDot(300)} />
                                </div>
                            </div>
                        )}

                        {/* Quick actions */}
                        {messages.length <= 1 && !isLoading && (
                            <div style={S.quickWrap}>
                                {QUICK_ACTIONS.map((action) => (
                                    <button key={action.label} onClick={() => sendMessage(action.text)} style={S.quickBtn}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#f3e8ff' }}
                                    >
                                        {action.label}
                                        <ChevronRight size={12} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={endRef} />
                    </div>

                    {/* Input */}
                    <div style={S.inputArea}>
                        {/* File preview */}
                        {attachedFile && (
                            <div style={S.fileChip}>
                                {attachedFile.isImage ? <ImageIcon size={14} /> : <FileText size={14} />}
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {attachedFile.name}
                                </span>
                                <span style={{ color: '#9ca3af', fontSize: 11 }}>{formatFileSize(attachedFile.size)}</span>
                                <button onClick={() => setAttachedFile(null)} style={S.fileChipRemove}>
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                        {fileError && (
                            <div style={{ fontSize: 11, color: '#ef4444', padding: '4px 0' }}>{fileError}</div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} style={S.inputForm}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                style={{
                                    ...S.attachBtn,
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                                title="Đính kèm tài liệu"
                            >
                                <Paperclip size={16} />
                            </button>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={attachedFile ? 'Hỏi về tài liệu...' : 'Hỏi AI bất kỳ điều gì...'}
                                disabled={isLoading}
                                maxLength={2000}
                                style={{
                                    ...S.input,
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || (!input.trim() && !attachedFile)}
                                style={{
                                    ...S.sendBtn,
                                    opacity: (isLoading || (!input.trim() && !attachedFile)) ? 0.5 : 1,
                                    cursor: (isLoading || (!input.trim() && !attachedFile)) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
