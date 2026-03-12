'use client'

import { formatCurrency, formatDate } from '@/lib/utils'

export type Column<T> = {
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
    format?: 'currency' | 'date' | 'text'
    render?: (row: T) => React.ReactNode
    width?: string | number
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    emptyText?: string
    onRowClick?: (row: T) => void
    rowKey?: (row: T) => string
}

export default function DataTable<T>({ columns, data, emptyText = 'Không có dữ liệu', onRowClick, rowKey }: DataTableProps<T>) {
    const getKey = rowKey || ((_row: T, i: number) => String(i))

    function formatValue(value: unknown, format?: 'currency' | 'date' | 'text'): string {
        if (value === null || value === undefined) return '—'
        if (format === 'currency') return formatCurrency(Number(value))
        if (format === 'date') return formatDate(String(value).split('T')[0])
        return String(value)
    }

    return (
        <table className="data-table" style={{ fontSize: 13 }}>
            <thead>
                <tr>
                    {columns.map(col => (
                        <th key={col.key} style={{ textAlign: col.align || 'left', width: col.width }}>{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: '#8FA3BF', padding: 24 }}>{emptyText}</td></tr>
                ) : data.map((row, i) => (
                    <tr key={getKey(row, i)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        style={onRowClick ? { cursor: 'pointer' } : undefined}>
                        {columns.map(col => (
                            <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                                {col.render ? col.render(row) : formatValue((row as Record<string, unknown>)[col.key], col.format)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
