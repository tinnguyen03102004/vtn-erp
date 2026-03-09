'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearch } from '@/lib/actions/search'

const typeIcons: Record<string, string> = { lead: '🎯', order: '📋', project: '🏗️', invoice: '📄', employee: '👤' }
const typeLabels: Record<string, string> = { lead: 'Lead', order: 'Báo giá', project: 'Dự án', invoice: 'Hoá đơn', employee: 'Nhân viên' }

export default function GlobalSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<{ type: string; id: string; title: string; subtitle: string; url: string }[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return }
        setLoading(true)
        try {
            const result = await globalSearch(q)
            setResults(result.success ? result.data : [])
            setSelected(-1)
        } finally { setLoading(false) }
    }, [])

    function handleChange(val: string) {
        setQuery(val)
        setOpen(true)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 300)
    }

    function handleSelect(url: string) {
        setOpen(false)
        setQuery('')
        setResults([])
        router.push(url)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
        if (e.key === 'Enter' && selected >= 0 && results[selected]) handleSelect(results[selected].url)
        if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    }

    // Keyboard shortcut: Ctrl+K
    useEffect(() => {
        function handleGlobalKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
                setOpen(true)
            }
        }
        window.addEventListener('keydown', handleGlobalKey)
        return () => window.removeEventListener('keydown', handleGlobalKey)
    }, [])

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <div style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8FA3BF" strokeWidth="2"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => handleChange(e.target.value)}
                    onFocus={() => query.length >= 2 && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm kiếm... (Ctrl+K)"
                    style={{
                        width: '100%', padding: '8px 12px 8px 36px', border: '1.5px solid #E2E8F0',
                        borderRadius: 8, fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
                        background: '#F8F9FB', color: '#0F1C2E',
                    }}
                />
                {loading && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#8FA3BF' }}>⏳</span>}
                <kbd style={{
                    position: 'absolute', right: loading ? 30 : 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 10, color: '#8FA3BF', background: '#E2E8F0', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace',
                }}>⌘K</kbd>
            </div>

            {open && results.length > 0 && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                    background: '#fff', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0', zIndex: 9999, maxHeight: 400, overflowY: 'auto',
                }}>
                    {results.map((r, i) => (
                        <div key={`${r.type}-${r.id}`}
                            onClick={() => handleSelect(r.url)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                cursor: 'pointer', fontSize: 13,
                                background: i === selected ? '#EFF3FA' : 'transparent',
                                borderBottom: i < results.length - 1 ? '1px solid #F0F2F5' : 'none',
                            }}>
                            <span style={{ fontSize: 16 }}>{typeIcons[r.type]}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#0F1C2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                <div style={{ fontSize: 11, color: '#8FA3BF' }}>{r.subtitle}</div>
                            </div>
                            <span style={{ fontSize: 10, color: '#8FA3BF', background: '#F0F2F5', padding: '2px 6px', borderRadius: 4 }}>{typeLabels[r.type]}</span>
                        </div>
                    ))}
                </div>
            )}

            {open && query.length >= 2 && results.length === 0 && !loading && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
                    background: '#fff', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0', padding: '20px', textAlign: 'center', color: '#8FA3BF', fontSize: 13, zIndex: 9999,
                }}>Không tìm thấy kết quả</div>
            )}
        </div>
    )
}
