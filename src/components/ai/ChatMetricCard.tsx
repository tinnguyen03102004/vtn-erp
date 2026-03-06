'use client'

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface ChatMetricCardProps {
    title: string
    value: string
    icon?: string
    trend?: {
        direction: 'up' | 'down'
        percent: number
    }
    disclaimer?: string
}

export function ChatMetricCard({ title, value, icon = '💰', trend, disclaimer }: ChatMetricCardProps) {
    return (
        <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 backdrop-blur-sm p-4 space-y-2 max-w-[400px]">
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</h4>

            <p className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
                {icon} {value}
            </p>

            {trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend.direction === 'up' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {trend.direction === 'up' ? '+' : '-'}{trend.percent}% so với tháng trước
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
