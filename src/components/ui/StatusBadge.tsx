const COLOR_MAP: Record<string, string> = {
    // Sale
    DRAFT: 'muted', SENT: 'info', APPROVED: 'success', REJECTED: 'danger', EXPIRED: 'warning',
    NEGOTIATING: 'info', SIGNED: 'success', DONE: 'primary', CANCEL: 'danger', SALE: 'primary',
    // CRM
    NEW: 'info', CONTACTED: 'info', QUALIFIED: 'success', LOST: 'danger', WON: 'success',
    // Project
    PLANNING: 'muted', IN_PROGRESS: 'info', ON_HOLD: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
    // Invoice
    PAID: 'success', PARTIAL: 'warning', OVERDUE: 'danger', PENDING: 'muted',
    // General
    ACTIVE: 'success', INACTIVE: 'muted',
}

const LABEL_MAP: Record<string, string> = {
    // Sale
    DRAFT: 'Nháp', SENT: 'Đã gửi', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn',
    NEGOTIATING: 'Đang đàm phán', SIGNED: 'Đã ký', DONE: 'Hoàn thành', CANCEL: 'Huỷ', SALE: 'Đã ký',
    // CRM
    NEW: 'Mới', CONTACTED: 'Đã liên hệ', QUALIFIED: 'Đủ điều kiện', LOST: 'Thất bại', WON: 'Thắng',
    // Project
    PLANNING: 'Lập kế hoạch', IN_PROGRESS: 'Đang thực hiện', ON_HOLD: 'Tạm dừng',
    COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
    // Invoice
    PAID: 'Đã thanh toán', PARTIAL: 'Thanh toán một phần', OVERDUE: 'Quá hạn', PENDING: 'Chờ xử lý',
    // General
    ACTIVE: 'Hoạt động', INACTIVE: 'Không hoạt động',
}

interface StatusBadgeProps {
    state: string
    label?: string
    colorMap?: Record<string, string>
    labelMap?: Record<string, string>
}

export default function StatusBadge({ state, label, colorMap, labelMap }: StatusBadgeProps) {
    const colors = colorMap || COLOR_MAP
    const labels = labelMap || LABEL_MAP
    const color = colors[state] || 'muted'
    const text = label || labels[state] || state

    return <span className={`badge badge-${color}`}>{text}</span>
}
