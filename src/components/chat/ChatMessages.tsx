import React from 'react'
import { Bot, User, Check, XCircle } from 'lucide-react'
import type { Message, PendingAction } from './chatConstants'
import { S, TOOL_LABELS, FIELD_LABELS, formatArgValue } from './chatConstants'

// ── Safe Markdown renderer ──

function renderBoldSegments(text: string, parentKey: string) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, j) =>
        j % 2 === 1
            ? <strong key={`${parentKey}-b${j}`}>{part}</strong>
            : <span key={`${parentKey}-s${j}`}>{part}</span>
    )
}

export function renderMarkdown(text: string) {
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

// ── Message Bubble ──

interface ChatMessagesProps {
    messages: Message[]
    pendingAction: PendingAction | null
    isLoading: boolean
    onConfirm: () => void
    onReject: () => void
}

export default function ChatMessages({ messages, pendingAction, isLoading, onConfirm, onReject }: ChatMessagesProps) {
    return (
        <>
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
                        <button onClick={onConfirm} style={S.confirmBtnOk}>
                            <Check size={14} /> Xác nhận
                        </button>
                        <button onClick={onReject} style={S.confirmBtnCancel}>
                            <XCircle size={14} /> Hủy
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
