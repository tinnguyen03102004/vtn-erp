import type { CSSProperties } from 'react'

// ââ Types ââ

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
}

export interface PendingAction {
    toolName: string
    args: Record<string, string | number | boolean | null | undefined>
    preview: string
}

// ââ LocalStorage ââ

const STORAGE_KEY = 'vtn_ai_chat'

export function loadMessages(): Message[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) return (JSON.parse(stored) as Message[]).slice(-50)
    } catch { /* corrupted */ }
    return []
}

export function saveMessages(messages: Message[]) {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))) }
    catch { /* storage full */ }
}

// ââ Welcome ââ

export const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `Xin chÃ o! TÃ´i lÃ  **trá»£ lÃ½ AI** cá»§a VTN Architects ð-ï¸

TÃ´i cÃ³ thá» giÃºp báº¡n:
â¢ ð Xem tá»ng quan dashboard
â¢ ð¤ Quáº£n lÃ½ khÃ¡ch hÃ ng (leads)
â¢ ð° Táº¡o & phÃ¢n tÃ­ch bÃ¡o giÃ¡
â¢ ð Xem há»£p Äá»ng, dá»± Ã¡n
â¢ ðµ Æ¯á»c tÃ­nh giÃ¡ dá»ch vá»¥
â¢ ð TÃ¬m kiáº¿m nhanh

HÃ£y há»i gÃ¬ Äi nÃ o!`,
    timestamp: Date.now(),
}

export const QUICK_ACTIONS = [
    { label: 'ð Tá»ng quan', text: 'Tá»ng quan hÃ´m nay' },
    { label: 'ð¤ Leads', text: 'Danh sÃ¡ch lead' },
    { label: 'ð° BÃ¡o giÃ¡', text: 'Danh sÃ¡ch bÃ¡o giÃ¡' },
    { label: 'ðµ Æ¯á»c tÃ­nh giÃ¡', text: 'Æ¯á»c tÃ­nh thiáº¿t káº¿ biá»t thá»± 300m2 trá»n gÃ³i' },
]

export const TOOL_LABELS: Record<string, string> = {
    create_lead: 'ð¤ Táº¡o Lead',
    create_quotation: 'ð° Táº¡o BÃ¡o giÃ¡',
    send_quotation: 'ð¤ Gá»­i BÃ¡o giÃ¡',
    create_employee: 'ð§âð¼ Táº¡o NhÃ¢n viÃªn',
    log_timesheet: 'â±ï¸ Log Timesheet',
    create_task: 'ð Táº¡o Task',
    convert_lead_to_quotation: 'ð Chuyá»n Lead â BÃ¡o giÃ¡',
}

export const FIELD_LABELS: Record<string, string> = {
    partnerName: 'KhÃ¡ch hÃ ng',
    email: 'Email',
    phone: 'SÄT',
    expectedValue: 'GiÃ¡ trá» dá»± kiáº¿n',
    totalAmount: 'Tá»ng tiá»n',
    notes: 'Ghi chÃº',
    partnerEmail: 'Email KH',
    partnerPhone: 'SÄT KH',
    name: 'TÃªn',
    department: 'PhÃ²ng ban',
    position: 'Chá»©c vá»¥',
    salary: 'LÆ°Æ¡ng',
    leadId: 'Lead ID',
    projectId: 'Dá»± Ã¡n ID',
    description: 'MÃ´ táº£',
    hours: 'Sá» giá»',
    priority: 'Æ¯u tiÃªn',
    query: 'Tá»« khÃ³a',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatArgValue(key: string, val: any): string {
    if (val === null || val === undefined) return 'â'
    if (typeof val === 'number' && ['expectedValue', 'totalAmount', 'salary', 'amount'].includes(key)) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val)
    }
    return String(val)
}

// ââ Styles ââ

export const S = {
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

export const KEYFRAMES = `
@keyframes chatBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
}
`
