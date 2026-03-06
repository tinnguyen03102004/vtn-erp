import { formatCurrency, formatDate } from '@/lib/utils'
import { getInvoices } from '@/lib/actions/finance'

export const dynamic = 'force-dynamic'

const stateColors: Record<string, string> = { DRAFT: 'muted', POSTED: 'info', PAID: 'success', CANCELLED: 'danger' }
const stateLabels: Record<string, string> = { DRAFT: 'Nháp', POSTED: 'Đã xuất', PAID: 'Đã thanh toán', CANCELLED: 'Huỷ' }

export default async function InvoicesPage() {
    const invoices = await getInvoices()

    const totalAmount = invoices.reduce((s, i) => s + Number(i.amountTotal), 0)
    const paidAmount = invoices.filter(i => i.state === 'PAID').reduce((s, i) => s + Number(i.amountTotal), 0)
    const pendingAmount = invoices.filter(i => i.state === 'POSTED').reduce((s, i) => s + Number(i.amountTotal), 0)

    return (
        <>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="page-title">Hoá đơn</h1>
                    <p className="page-subtitle">{invoices.length} hoá đơn — Tổng: {formatCurrency(totalAmount)}</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary btn-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Tạo hoá đơn
                    </button>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Tổng hoá đơn', value: formatCurrency(totalAmount), icon: '📄', color: '#EFF3FA' },
                    { label: 'Đã thanh toán', value: formatCurrency(paidAmount), icon: '✅', color: '#F0FDF4' },
                    { label: 'Chờ thanh toán', value: formatCurrency(pendingAmount), icon: '⏳', color: '#FBF5E6' },
                    { label: 'Nháp', value: `${invoices.filter(i => i.state === 'DRAFT').length}`, icon: '📝', color: '#F8F9FB' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="kpi-label">{k.label}</div>
                                <div className="kpi-value" style={{ fontSize: 22, marginTop: 4 }}>{k.value}</div>
                            </div>
                            <div style={{ fontSize: 28 }}>{k.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header" style={{ paddingBottom: 16 }}>
                    <div className="card-title">Danh sách Hoá đơn</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Số hoá đơn</th>
                                <th>Khách hàng</th>
                                <th>Dự án</th>
                                <th>Trạng thái</th>
                                <th>Ngày xuất</th>
                                <th>Hạn thanh toán</th>
                                <th>Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1F3A5F', fontSize: 13 }}>{inv.name}</span></td>
                                    <td style={{ fontWeight: 600, fontSize: 13 }}>{inv.partnerName}</td>
                                    <td style={{ fontSize: 13, color: '#4A5E78' }}>{inv.project?.name ?? '—'}</td>
                                    <td><span className={`badge badge-${stateColors[inv.state]}`}>{stateLabels[inv.state]}</span></td>
                                    <td style={{ color: '#8FA3BF', fontSize: 13 }}>{inv.invoiceDate ? formatDate(String(inv.invoiceDate).split('T')[0]) : '—'}</td>
                                    <td style={{ color: '#8FA3BF', fontSize: 13 }}>{inv.dueDate ? formatDate(String(inv.dueDate).split('T')[0]) : '—'}</td>
                                    <td style={{ fontWeight: 700, color: '#1F3A5F' }}>{formatCurrency(Number(inv.amountTotal))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
