'use client'

import { formatDate } from '@/lib/utils'

interface SaleOrderInfoProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order: any
    isQuotation: boolean
}

export default function SaleOrderInfo({ order, isQuotation }: SaleOrderInfoProps) {
    const fields = [
        { label: 'Khách hàng', value: order.partnerName },
        { label: 'Email', value: order.partnerEmail ?? '—' },
        { label: 'SĐT', value: order.partnerPhone ?? '—' },
        { label: 'Ngày tạo', value: order.createdAt ? formatDate(String(order.createdAt).split('T')[0]) : '—' },
        ...(isQuotation ? [
            { label: 'Hiệu lực', value: order.validityDate ? formatDate(String(order.validityDate).split('T')[0]) : '—' },
            ...(order.sentAt ? [{ label: 'Ngày gửi', value: formatDate(String(order.sentAt).split('T')[0]) }] : []),
            ...(order.approvedAt ? [{ label: 'Ngày duyệt', value: formatDate(String(order.approvedAt).split('T')[0]) }] : []),
        ] : [
            ...(order.signedAt ? [{ label: 'Ngày ký', value: formatDate(String(order.signedAt).split('T')[0]) }] : []),
        ]),
    ]

    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{isQuotation ? 'Thông tin báo giá' : 'Thông tin hợp đồng'}</div>
            {fields.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: '#8FA3BF', width: 100, flexShrink: 0 }}>{label}</span>
                    <span style={{ color: '#0F1C2E' }}>{value}</span>
                </div>
            ))}
            {order.rejectedReason && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
                    <strong>Lý do từ chối:</strong> {order.rejectedReason}
                </div>
            )}
        </div>
    )
}
