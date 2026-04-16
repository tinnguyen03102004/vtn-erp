// ================================================================
// @vtn/vietnam/vietqr — VietQR Quick Response Code
// Theo chuẩn NAPAS — Thanh toán bằng QR code
// ================================================================

export interface VietQrParams {
    /** Mã ngân hàng (BIN) theo NAPAS — VD: 970422 = MB Bank */
    bankBin: string
    /** Số tài khoản người nhận */
    accountNumber: string
    /** Tên người nhận (rút gọn, không dấu) */
    accountName?: string
    /** Số tiền (VND) */
    amount?: number
    /** Nội dung chuyển khoản */
    memo?: string
}

/**
 * Mã BIN các ngân hàng phổ biến tại Việt Nam.
 */
export const BANK_BINS: Record<string, { bin: string; name: string; shortName: string }> = {
    VIETCOMBANK: { bin: '970436', name: 'NH TMCP Ngoại Thương VN', shortName: 'Vietcombank' },
    VIETINBANK: { bin: '970415', name: 'NH TMCP Công Thương VN', shortName: 'VietinBank' },
    BIDV: { bin: '970418', name: 'NH TMCP Đầu Tư và PT VN', shortName: 'BIDV' },
    AGRIBANK: { bin: '970405', name: 'NH Nông Nghiệp VN', shortName: 'Agribank' },
    MBBANK: { bin: '970422', name: 'NH TMCP Quân Đội', shortName: 'MB' },
    TECHCOMBANK: { bin: '970407', name: 'NH TMCP Kỹ Thương VN', shortName: 'Techcombank' },
    ACBBANK: { bin: '970416', name: 'NH TMCP Á Châu', shortName: 'ACB' },
    VPBANK: { bin: '970432', name: 'NH TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank' },
    TPBANK: { bin: '970423', name: 'NH TMCP Tiên Phong', shortName: 'TPBank' },
    SACOMBANK: { bin: '970403', name: 'NH TMCP Sài Gòn Thương Tín', shortName: 'Sacombank' },
    HDBANK: { bin: '970437', name: 'NH TMCP Phát Triển TP.HCM', shortName: 'HDBank' },
    OCBBANK: { bin: '970448', name: 'NH TMCP Phương Đông', shortName: 'OCB' },
    MSBANK: { bin: '970426', name: 'NH TMCP Hàng Hải VN', shortName: 'MSB' },
    SHBBANK: { bin: '970443', name: 'NH TMCP Sài Gòn Hà Nội', shortName: 'SHB' },
}

/**
 * Tạo URL VietQR sử dụng API img.vietqr.io.
 * Trả về URL ảnh QR code có thể dùng trực tiếp trong \<img\> tag.
 *
 * @example
 * generateVietQrUrl({
 *   bankBin: '970422',
 *   accountNumber: '0123456789',
 *   amount: 1500000,
 *   memo: 'Thanh toan don hang DH001',
 * })
 * // → 'https://img.vietqr.io/image/970422-0123456789-compact.png?amount=1500000&addInfo=...'
 */
export function generateVietQrUrl(params: VietQrParams): string {
    const { bankBin, accountNumber, amount, memo, accountName } = params
    const base = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact.png`

    const query = new URLSearchParams()
    if (amount) query.set('amount', String(amount))
    if (memo) query.set('addInfo', memo)
    if (accountName) query.set('accountName', accountName)

    const queryStr = query.toString()
    return queryStr ? `${base}?${queryStr}` : base
}

/**
 * Tìm ngân hàng theo BIN code.
 */
export function findBankByBin(bin: string) {
    return Object.values(BANK_BINS).find(b => b.bin === bin)
}

/**
 * Tìm ngân hàng theo tên viết tắt.
 */
export function findBankByShortName(shortName: string) {
    return Object.values(BANK_BINS).find(
        b => b.shortName.toLowerCase() === shortName.toLowerCase()
    )
}
