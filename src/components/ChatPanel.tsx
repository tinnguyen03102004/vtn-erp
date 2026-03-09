'use client'

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { Bot, X, Send, User, Loader2, Maximize2, Minimize2, Trash2, ChevronRight, Check, XCircle } from 'lucide-react'

// ── Types ──

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

interface PendingAction {
    toolName: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: Record<string, any>
    preview: string
}

// ── LocalStorage ──

const STORAGE_KEY = 'vtn_ai_chat'

function loadMessages(): Message[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return (JSON.parse(stored) as Message[]).slice(-50)
    } catch { /* corrupted */ }
    return []
}

function saveMessages(messages: Message[]) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))) }
    catch { /* storage full */ }
}

// ── Welcome ──

const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `Xin chào! Tôi là **trợ lý AI** của VTN Architects 🏗️

Tôi có thể giúp bạn:
• 📊 Xem tổng quan dashboard
• 👤 Quản lý khách hàng (leads)
• 💰 Tạo & phân tích báo giá
• 📋 Xem hợp đồng, dự án
• 💵 Ước tính giá dịch vụ
• 🔍 Tìm kiếm nhanh

Hãy hỏi gì đi nào!`,
    timestamp: Date.now(),
}

const QUICK_ACTIONS = [
    { label: '📊 Tổng quan', text: 'Tổng quan hôm nay' },
    { label: '👤 Leads', text: 'Danh sách lead' },
    { label: '💰 Báo giá', text: 'Danh sách báo giá' },
    { label: '💵 Ước tính giá', text: 'Ước tính thiết kế biệt thự 300m2 trọn gói' },
]

const TOOL_LABELS: Record<string, string> = {
    create_lead: '👤 Tạo Lead',
    create_quotation: '💰 Tạo Báo giá',
    send_quotation: '📤 Gửi Báo giá',
    create_employee: '🧑‍💼 Tạo Nhân viên',
    log_timesheet: '⏱️ Log Timesheet',
    create_task: '📋 Tạo Task',
    convert_lead_to_quotation: '🔄 Chuyển Lead → Báo giá',
}

const FIELD_LABELS: Record<string, string> = {
    partnerName: 'Khách hàng',
    email: 'Email',
    phone: 'SĐT',
    expectedValue: 'Giá trị dự kiến',
    totalAmount: 'Tổng tiền',
    notes: 'Ghi chú',
    partnerEmail: 'Email KH',
    partnerPhone: 'SĐT KH',
    name: 'Tên',
    department: 'Phòng ban',
    position: 'Chức vụ',
    salary: 'Lương',
    leadId: 'Lead ID',
    projectId: 'Dự án ID',
    description: 'Mô tả',
    hours: 'Số giờ',
    priority: 'Ưu tiên',
    query: 'Từ khóa',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatArgValue(key: string, val: any): string {
    if (val === null || val === undefined) return '—'
    if (typeof val === 'number' && ['expectedValue', 'totalAmount', 'salary', 'amount'].includes(key)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
    }
    return String(val)
}

const S = {
    fab: {
        position: 'fixed', bottom: 24, right: 24, zIndex: 200,
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
    } as CSSProperties,
    fabDot: {
        position: 'absolute', top: -2, right: -2,
        width: 12, height: 12, borderRadius: '50%',
        background: '#4ade80', border: '2px solid #fff',
    } as CSSProperties,
    panel: (w: number, h: number): CSSProperties => ({
        position: 'fixed', bottom: 24, right: 24, zIndex: 200,
        width: w, height: h,
        maxHeight: 'calc(100vh - 6rem)', maxWidth: 'calc(100vw - 2rem)',
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'width 0.3s, height 0.3s',
    }),
    header: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'linear-gradient(90deg, var(--color-primary), #7c3aed)',
        color: '#fff', flexShrink: 0,
    } as CSSProperties,
    headerTitle: { fontWeight: 600, fontSize: 14, margin: 0 } as CSSProperties,
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 } as CSSProperties,
    headerBtn: {
        padding: 6, borderRadius: 8, border: 'none', background: 'transparent',
        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    } as CSSProperties,
    msgArea: {
        flex: 1, overflowY: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 12,
    } as CSSProperties,
    msgRow: (isUser: boolean): CSSProperties => ({
        display: 'flex', gap: 8,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
    }),
    avatar: (bg: string): CSSProperties => ({
        width: 28, height: 28, borderRadius: '50%', background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }),
    bubble: (isUser: boolean): CSSProperties => ({
        maxWidth: '85%', borderRadius: 12, padding: '8px 12px',
        background: isUser ? 'var(--color-primary)' : '#f3f4f6',
        color: isUser ? '#fff' : '#1f2937',
        fontSize: 13, lineHeight: 1.5,
    }),
    inputArea: {
        flexShrink: 0, padding: 12,
        borderTop: '1px solid #e5e7eb',
    } as CSSProperties,
    inputForm: { display: 'flex', gap: 8 } as CSSProperties,
    input: {
        flex: 1, fontSize: 14, padding: '8px 12px',
        borderRadius: 8, border: '1px solid #e5e7eb',
        outline: 'none', background: '#fff', color: '#1f2937',
    } as CSSProperties,
    sendBtn: {
        padding: '8px 12px', borderRadius: 8, border: 'none',
        background: 'linear-gradient(90deg, var(--color-primary), #7c3aed)',
        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    } as CSSProperties,
    quickWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 } as CSSProperties,
    quickBtn: {
        fontSize: 12, padding: '6px 12px', borderRadius: 20,
        border: 'none', background: '#f3e8ff', color: '#7c3aed',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
    } as CSSProperties,
    loadingDot: (delay: number): CSSProperties => ({
        width: 8, height: 8, borderRadius: '50%', background: '#9ca3af',
        animation: 'chatBounce 1s infinite',
        animationDelay: `${delay}ms`,
    }),
    confirmCard: {
        borderRadius: 12, border: '2px solid #fbbf24',
        background: '#fffbeb', padding: 12,
    } as CSSProperties,
    confirmTitle: { fontSize: 12, fontWeight: 600, color: '#b45309', margin: '0 0 8px' } as CSSProperties,
    confirmPre: {
        background: '#f9fafb', borderRadius: 8, padding: 8,
        fontSize: 11, overflow: 'auto', border: '1px solid #e5e7eb',
        margin: '8px 0',
    } as CSSProperties,
    confirmBtnOk: {
        flex: 1, fontSize: 12, padding: '6px 12px', borderRadius: 8,
        border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    } as CSSProperties,
    confirmBtnCancel: {
        flex: 1, fontSize: 12, padding: '6px 12px', borderRadius: 8,
        border: 'none', background: '#e5e7eb', color: '#374151', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    } as CSSProperties,
}

// ── Safe Markdown renderer ──

function renderBoldSegments(text: string, parentKey: string) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, j) =>
        j % 2 === 1
            ? <strong key={`${parentKey}-b${j}`}>{part}</strong>
            : <span key={`${parentKey}-s${j}`}>{part}</span>
    )
}

function renderMarkdown(text: string) {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listBuffer: React.ReactNode[] = []
    let listType: 'ul' | 'ol' | null = null

    const flushList = () => {
        if (listBuffer.length > 0 && listType) {
            const Tag = listType
            elements.push(
                <Tag key={`list-${elements.length}`} style={{
                    listStyleType: listType === 'ul' ? 'disc' : 'decimal',
                    paddingLeft: 20, margin: '4px 0',
                }}>
                    {listBuffer}
                </Tag>
            )
            listBuffer = []
            listType = null
        }
    }

    lines.forEach((line, i) => {
        if (/^[•\-\*]\s/.test(line)) {
            if (listType !== 'ul') { flushList(); listType = 'ul' }
            const content = line.replace(/^[•\-\*]\s/, '')
            listBuffer.push(<li key={i} style={{ marginBottom: 2 }}>{renderBoldSegments(content, `l${i}`)}</li>)
            return
        }
        if (/^\d+\.\s/.test(line)) {
            if (listType !== 'ol') { flushList(); listType = 'ol' }
            const content = line.replace(/^\d+\.\s/, '')
            listBuffer.push(<li key={i} style={{ marginBottom: 2 }}>{renderBoldSegments(content, `l${i}`)}</li>)
            return
        }
        flushList()
        if (!line.trim()) {
            elements.push(<div key={i} style={{ height: 6 }} />)
        } else {
            elements.push(<p key={i} style={{ lineHeight: 1.6, margin: 0 }}>{renderBoldSegments(line, `l${i}`)}</p>)
        }
    })

    flushList()
    return elements
}

// ── Keyframes (injected once) ──

const KEYFRAMES = `
@keyframes chatBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
}
`

// ── Component ──

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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

    const sendMessage = async (text?: string) => {
        const msg = text || input
        if (!msg.trim() || isLoading) return

        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: Date.now() }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setInput('')
        setIsLoading(true)
        setPendingAction(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30_000)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
                }),
                signal: controller.signal,
            })

            const data = await res.json()

            if (data.error) {
                setMessages(prev => [...prev, {
                    id: `err-${Date.now()}`, role: 'assistant',
                    content: `❌ ${data.error}`, timestamp: Date.now(),
                }])
            } else {
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`, role: 'assistant',
                    content: data.content || '❌ Không có phản hồi.', timestamp: Date.now(),
                }])
                if (data.pendingAction) setPendingAction(data.pendingAction)
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const errorMsg = err?.name === 'AbortError'
                ? '⏱️ Hết thời gian chờ (30s). Vui lòng thử lại.'
                : '❌ Có lỗi kết nối. Vui lòng thử lại.'
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
                    confirmAction: { toolName: pendingAction.toolName, args: pendingAction.args },
                }),
                signal: controller.signal,
            })
            const data = await res.json()
            setMessages(prev => [...prev, {
                id: `confirm-${Date.now()}`, role: 'assistant',
                content: data.content || data.error || '❌ Lỗi xác nhận.', timestamp: Date.now(),
            }])
        } catch {
            setMessages(prev => [...prev, {
                id: `err-${Date.now()}`, role: 'assistant',
                content: '❌ Lỗi kết nối khi xác nhận.', timestamp: Date.now(),
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
            content: '🚫 Đã hủy thao tác.', timestamp: Date.now(),
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
                            <button onClick={clearHistory} style={S.headerBtn} title="Xóa lịch sử">
                                <Trash2 size={16} />
                            </button>
                            <button onClick={() => setIsExpanded(!isExpanded)} style={S.headerBtn} title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}>
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button onClick={() => setIsOpen(false)} style={S.headerBtn} title="Đóng">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={S.msgArea}>
                        {messages.map((message) => (
                            <div key={message.id} style={S.msgRow(message.role === 'user')}>
                                {message.role === 'assistant' && (
                                    <div style={S.avatar('#f3e8ff')}>
                                        <Bot size={16} color="#7c3aed" />
                                    </div>
                                )}
                                <div style={S.bubble(message.role === 'user')}>
                                    {renderMarkdown(message.content)}
                                </div>
                                {message.role === 'user' && (
                                    <div style={S.avatar('#e5e7eb')}>
                                        <User size={16} color="#6b7280" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {pendingAction && !isLoading && (
                            <div style={S.confirmCard}>
                                <p style={S.confirmTitle}>⚠️ Xác nhận thao tác</p>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#92400e' }}>
                                    {TOOL_LABELS[pendingAction.toolName] || pendingAction.toolName}
                                </p>
                                <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #fde68a', overflow: 'hidden' }}>
                                    {Object.entries(pendingAction.args)
                                        .filter(([, val]) => val !== null && val !== undefined && val !== '')
                                        .map(([key, val], idx) => (
                                            <div key={key} style={{
                                                display: 'flex', padding: '6px 10px', fontSize: 12,
                                                borderBottom: '1px solid #fef3c7',
                                                background: idx % 2 === 0 ? '#fffbeb' : '#fff',
                                            }}>
                                                <span style={{ fontWeight: 500, color: '#78716c', minWidth: 100, flexShrink: 0 }}>
                                                    {FIELD_LABELS[key] || key}
                                                </span>
                                                <span style={{ color: '#1c1917', fontWeight: 500 }}>
                                                    {formatArgValue(key, val)}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <button onClick={handleConfirmAction} style={S.confirmBtnOk}>
                                        <Check size={14} /> Xác nhận
                                    </button>
                                    <button onClick={handleRejectAction} style={S.confirmBtnCancel}>
                                        <XCircle size={14} /> Hủy
                                    </button>
                                </div>
                            </div>
                        )}

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
                        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} style={S.inputForm}>
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Hỏi AI bất kỳ điều gì..."
                                disabled={isLoading}
                                maxLength={2000}
                                style={{
                                    ...S.input,
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                style={{
                                    ...S.sendBtn,
                                    opacity: (isLoading || !input.trim()) ? 0.5 : 1,
                                    cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
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
