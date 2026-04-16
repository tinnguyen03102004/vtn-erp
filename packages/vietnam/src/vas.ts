// ================================================================
// @vtn/vietnam/vas — Hệ thống tài khoản theo Thông tư 200/2014
// Vietnamese Accounting Standards (VAS) — Chart of Accounts
// ================================================================

export interface AccountEntry {
    code: string
    name: string
    /** Loại: 1=Tài sản, 2=Nguồn vốn, 5=Doanh thu, 6=Chi phí, 7=Thu nhập khác, 8=Chi phí khác */
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    /** Tài khoản gốc hay chi tiết */
    level: 1 | 2 | 3
    /** Tài khoản cha */
    parentCode?: string
}

/**
 * Hệ thống tài khoản kế toán theo TT200 — chỉ các tài khoản phổ biến.
 * Đầy đủ cho SME kiến trúc/xây dựng (~50 tài khoản chính).
 */
export const VAS_CHART_OF_ACCOUNTS: AccountEntry[] = [
    // ── Loại 1: Tài sản ngắn hạn ──
    { code: '111', name: 'Tiền mặt', type: 'asset', level: 1 },
    { code: '1111', name: 'Tiền Việt Nam', type: 'asset', level: 2, parentCode: '111' },
    { code: '112', name: 'Tiền gửi ngân hàng', type: 'asset', level: 1 },
    { code: '1121', name: 'Tiền Việt Nam', type: 'asset', level: 2, parentCode: '112' },
    { code: '131', name: 'Phải thu khách hàng', type: 'asset', level: 1 },
    { code: '133', name: 'Thuế GTGT được khấu trừ', type: 'asset', level: 1 },
    { code: '1331', name: 'Thuế GTGT hàng hóa/dịch vụ', type: 'asset', level: 2, parentCode: '133' },
    { code: '1332', name: 'Thuế GTGT TSCĐ', type: 'asset', level: 2, parentCode: '133' },
    { code: '141', name: 'Tạm ứng', type: 'asset', level: 1 },
    { code: '142', name: 'Chi phí trả trước ngắn hạn', type: 'asset', level: 1 },
    { code: '152', name: 'Nguyên liệu, vật liệu', type: 'asset', level: 1 },
    { code: '153', name: 'Công cụ, dụng cụ', type: 'asset', level: 1 },
    { code: '154', name: 'Chi phí SXKD dở dang', type: 'asset', level: 1 },

    // ── Loại 2: Tài sản dài hạn ──
    { code: '211', name: 'Tài sản cố định hữu hình', type: 'asset', level: 1 },
    { code: '2111', name: 'Nhà cửa, vật kiến trúc', type: 'asset', level: 2, parentCode: '211' },
    { code: '2112', name: 'Máy móc, thiết bị', type: 'asset', level: 2, parentCode: '211' },
    { code: '2113', name: 'Phương tiện vận tải', type: 'asset', level: 2, parentCode: '211' },
    { code: '2114', name: 'Thiết bị văn phòng', type: 'asset', level: 2, parentCode: '211' },
    { code: '214', name: 'Hao mòn TSCĐ', type: 'asset', level: 1 },
    { code: '242', name: 'Chi phí trả trước dài hạn', type: 'asset', level: 1 },

    // ── Loại 3: Nợ phải trả ──
    { code: '331', name: 'Phải trả cho người bán', type: 'liability', level: 1 },
    { code: '333', name: 'Thuế và các khoản phải nộp NN', type: 'liability', level: 1 },
    { code: '3331', name: 'Thuế GTGT phải nộp', type: 'liability', level: 2, parentCode: '333' },
    { code: '33311', name: 'Thuế GTGT đầu ra', type: 'liability', level: 3, parentCode: '3331' },
    { code: '3334', name: 'Thuế TNDN', type: 'liability', level: 2, parentCode: '333' },
    { code: '3335', name: 'Thuế TNCN', type: 'liability', level: 2, parentCode: '333' },
    { code: '334', name: 'Phải trả NLĐ', type: 'liability', level: 1 },
    { code: '338', name: 'Phải trả, phải nộp khác', type: 'liability', level: 1 },
    { code: '3383', name: 'BHXH', type: 'liability', level: 2, parentCode: '338' },
    { code: '3384', name: 'BHYT', type: 'liability', level: 2, parentCode: '338' },
    { code: '3386', name: 'BHTN', type: 'liability', level: 2, parentCode: '338' },
    { code: '341', name: 'Vay và nợ thuê tài chính dài hạn', type: 'liability', level: 1 },

    // ── Loại 4: Vốn chủ sở hữu ──
    { code: '411', name: 'Vốn đầu tư của CSH', type: 'equity', level: 1 },
    { code: '421', name: 'Lợi nhuận sau thuế chưa phân phối', type: 'equity', level: 1 },

    // ── Loại 5: Doanh thu ──
    { code: '511', name: 'Doanh thu bán hàng và CCDV', type: 'revenue', level: 1 },
    { code: '5111', name: 'DT bán hàng hóa', type: 'revenue', level: 2, parentCode: '511' },
    { code: '5112', name: 'DT bán thành phẩm', type: 'revenue', level: 2, parentCode: '511' },
    { code: '5113', name: 'DT cung cấp dịch vụ', type: 'revenue', level: 2, parentCode: '511' },
    { code: '515', name: 'Doanh thu hoạt động tài chính', type: 'revenue', level: 1 },

    // ── Loại 6: Chi phí ──
    { code: '621', name: 'Chi phí NVL trực tiếp', type: 'expense', level: 1 },
    { code: '622', name: 'Chi phí nhân công trực tiếp', type: 'expense', level: 1 },
    { code: '623', name: 'Chi phí sử dụng máy thi công', type: 'expense', level: 1 },
    { code: '627', name: 'Chi phí sản xuất chung', type: 'expense', level: 1 },
    { code: '632', name: 'Giá vốn hàng bán', type: 'expense', level: 1 },
    { code: '641', name: 'Chi phí bán hàng', type: 'expense', level: 1 },
    { code: '642', name: 'Chi phí quản lý doanh nghiệp', type: 'expense', level: 1 },
    { code: '635', name: 'Chi phí tài chính', type: 'expense', level: 1 },

    // ── Loại 7: Thu nhập khác ──
    { code: '711', name: 'Thu nhập khác', type: 'revenue', level: 1 },

    // ── Loại 8: Chi phí khác ──
    { code: '811', name: 'Chi phí khác', type: 'expense', level: 1 },
    { code: '821', name: 'Chi phí thuế TNDN', type: 'expense', level: 1 },

    // ── Loại 9: Xác định KQKD ──
    { code: '911', name: 'Xác định kết quả kinh doanh', type: 'expense', level: 1 },
]

/**
 * Tìm tài khoản theo mã.
 */
export function findAccount(code: string): AccountEntry | undefined {
    return VAS_CHART_OF_ACCOUNTS.find(a => a.code === code)
}

/**
 * Lấy tất cả tài khoản con.
 */
export function getChildAccounts(parentCode: string): AccountEntry[] {
    return VAS_CHART_OF_ACCOUNTS.filter(a => a.parentCode === parentCode)
}

/**
 * Lấy tất cả tài khoản theo loại.
 */
export function getAccountsByType(type: AccountEntry['type']): AccountEntry[] {
    return VAS_CHART_OF_ACCOUNTS.filter(a => a.type === type)
}

/**
 * Lấy tài khoản level 1 (tài khoản gốc).
 */
export function getRootAccounts(): AccountEntry[] {
    return VAS_CHART_OF_ACCOUNTS.filter(a => a.level === 1)
}
