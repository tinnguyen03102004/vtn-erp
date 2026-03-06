'use client'

import { ExternalLink, AlertTriangle } from 'lucide-react'

interface Column {
    key: string
    label: string
}

interface ChatDataTableProps {
    title: string
    columns: Column[]
    data: Record<string, unknown>[]
    disclaimer?: string
    linkPrefix?: string
}

export function ChatDataTable({ title, columns, data, disclaimer, linkPrefix }: ChatDataTableProps) {
    return (
        <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 backdrop-blur-sm p-4 space-y-3 max-w-full">
            <h4 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                📊 {title}
            </h4>

            {data.length === 0 ? (
                <p className="text-sm text-[var(--color-text-secondary)] italic">Không tìm thấy dữ liệu.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                {columns.map((col) => (
                                    <th key={col.key} className="text-left py-2 px-2 text-[var(--color-text-secondary)] font-medium uppercase tracking-wide text-[10px]">
                                        {col.label}
                                    </th>
                                ))}
                                {linkPrefix && <th className="w-8" />}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-primary)]/5 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="py-1.5 px-2 text-[var(--color-text)]">
                                            {String(row[col.key] ?? '—')}
                                        </td>
                                    ))}
                                    {linkPrefix && row.id ? (
                                        <td className="py-1.5 px-1">
                                            <a href={`${linkPrefix}/${String(row.id)}`} className="text-[var(--color-primary)] hover:opacity-70 transition-opacity">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {disclaimer && (
                <p className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-2">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {disclaimer}
                </p>
            )}
        </div>
    )
}
