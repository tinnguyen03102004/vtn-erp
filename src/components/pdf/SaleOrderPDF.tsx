import React from 'react'
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'

// Register Vietnamese-compatible font
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
})

const colors = {
    primary: '#1F3A5F',
    accent: '#C9A84C',
    text: '#0F1C2E',
    muted: '#8FA3BF',
    border: '#E2E8F0',
    bg: '#F8F9FB',
    white: '#ffffff',
}

const s = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: colors.text },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    companyName: { fontSize: 18, fontWeight: 700, color: colors.primary },
    companyInfo: { fontSize: 8, color: colors.muted, marginTop: 4 },
    docBadge: { backgroundColor: colors.primary, color: colors.white, padding: '6 14', borderRadius: 4, fontSize: 11, fontWeight: 700, alignSelf: 'flex-start' },
    docNumber: { fontSize: 11, fontWeight: 700, color: colors.primary, marginTop: 8, textAlign: 'right' },
    docDate: { fontSize: 9, color: colors.muted, marginTop: 2, textAlign: 'right' },

    // Divider
    divider: { borderBottomWidth: 1.5, borderBottomColor: colors.accent, marginBottom: 20 },

    // Info Section
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    infoBox: { width: '48%' },
    infoTitle: { fontSize: 8, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' as any, letterSpacing: 1, marginBottom: 6 },
    infoValue: { fontSize: 10, fontWeight: 500, marginBottom: 3 },
    infoMuted: { fontSize: 9, color: colors.muted },

    // Table
    table: { marginBottom: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4 },
    tableHeaderText: { color: colors.white, fontSize: 9, fontWeight: 700 },
    tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    tableRowAlt: { backgroundColor: colors.bg },
    col1: { width: '8%' },
    col2: { width: '47%' },
    col3: { width: '10%', textAlign: 'center' },
    col4: { width: '17%', textAlign: 'right' },
    col5: { width: '18%', textAlign: 'right' },

    // Total
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, paddingRight: 10 },
    totalLabel: { fontSize: 11, fontWeight: 500, color: colors.muted, marginRight: 20 },
    totalValue: { fontSize: 14, fontWeight: 700, color: colors.primary },

    // Milestones
    milestoneTitle: { fontSize: 11, fontWeight: 700, color: colors.primary, marginBottom: 10, marginTop: 10 },
    msRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border },

    // Notes
    notesBox: { marginTop: 20, padding: 14, backgroundColor: colors.bg, borderRadius: 6 },
    notesTitle: { fontSize: 9, fontWeight: 700, color: colors.muted, marginBottom: 6 },
    notesText: { fontSize: 9, color: colors.text, lineHeight: 1.6 },

    // Footer
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
    footerText: { fontSize: 7, color: colors.muted },

    // Signature
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    signatureBox: { width: '45%', alignItems: 'center' },
    signatureLabel: { fontSize: 9, fontWeight: 700, color: colors.muted, marginBottom: 40 },
    signatureLine: { borderBottomWidth: 1, borderBottomColor: colors.text, width: '100%', marginBottom: 4 },
    signatureName: { fontSize: 9, color: colors.muted },
})

function formatCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'VNĐ')
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

type Props = {
    order: any
}

export default function SaleOrderPDF({ order }: Props) {
    const isQuotation = order.docType === 'QUOTATION'
    const docTitle = isQuotation ? 'BÁO GIÁ' : 'HỢP ĐỒNG'
    const lines = order.lines || []
    const milestones = order.milestones || []
    const totalAmount = Number(order.totalAmount || 0)

    return (
        <Document>
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.companyName}>CÔNG TY TNHH VÕ TRỌNG NGHĨA</Text>
                        <Text style={s.companyInfo}>Số 23 Đường 55, KP1, P. Cát Lái, TP. Hồ Chí Minh</Text>
                        <Text style={s.companyInfo}>ĐT: (028) 6287 4411 • MST: 0303506388</Text>
                    </View>
                    <View>
                        <Text style={s.docBadge}>{docTitle}</Text>
                        <Text style={s.docNumber}>{order.name}</Text>
                        <Text style={s.docDate}>Ngày: {formatDate(order.createdAt)}</Text>
                        {order.validityDate && <Text style={s.docDate}>Hiệu lực: {formatDate(order.validityDate)}</Text>}
                    </View>
                </View>

                <View style={s.divider} />

                {/* Info */}
                <View style={s.infoRow}>
                    <View style={s.infoBox}>
                        <Text style={s.infoTitle}>Khách hàng</Text>
                        <Text style={s.infoValue}>{order.partnerName}</Text>
                        {order.partnerEmail && <Text style={s.infoMuted}>{order.partnerEmail}</Text>}
                        {order.partnerPhone && <Text style={s.infoMuted}>{order.partnerPhone}</Text>}
                    </View>
                    <View style={s.infoBox}>
                        <Text style={s.infoTitle}>Thông tin</Text>
                        <Text style={s.infoValue}>Trạng thái: {order.state}</Text>
                        {order.sentAt && <Text style={s.infoMuted}>Gửi: {formatDate(order.sentAt)}</Text>}
                        {order.approvedAt && <Text style={s.infoMuted}>Duyệt: {formatDate(order.approvedAt)}</Text>}
                        {order.signedAt && <Text style={s.infoMuted}>Ký: {formatDate(order.signedAt)}</Text>}
                    </View>
                </View>

                {/* Table */}
                <View style={s.table}>
                    <View style={s.tableHeader}>
                        <Text style={[s.tableHeaderText, s.col1]}>#</Text>
                        <Text style={[s.tableHeaderText, s.col2]}>Mô tả dịch vụ</Text>
                        <Text style={[s.tableHeaderText, s.col3]}>SL</Text>
                        <Text style={[s.tableHeaderText, s.col4]}>Đơn giá</Text>
                        <Text style={[s.tableHeaderText, s.col5]}>Thành tiền</Text>
                    </View>
                    {lines.map((line: any, i: number) => (
                        <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                            <Text style={s.col1}>{i + 1}</Text>
                            <Text style={s.col2}>{line.description}</Text>
                            <Text style={s.col3}>{line.qty}</Text>
                            <Text style={s.col4}>{formatCurrency(Number(line.unitPrice || 0))}</Text>
                            <Text style={s.col5}>{formatCurrency(Number(line.subtotal || line.qty * (line.unitPrice || 0)))}</Text>
                        </View>
                    ))}
                </View>

                {/* Total */}
                <View style={s.totalRow}>
                    <Text style={s.totalLabel}>TỔNG CỘNG</Text>
                    <Text style={s.totalValue}>{formatCurrency(totalAmount)}</Text>
                </View>

                {/* Milestones */}
                {!isQuotation && milestones.length > 0 && (
                    <View>
                        <Text style={s.milestoneTitle}>Tiến độ thanh toán</Text>
                        {milestones.map((ms: any, i: number) => (
                            <View key={i} style={s.msRow}>
                                <Text style={{ fontWeight: 500 }}>{ms.name} ({ms.percent}%)</Text>
                                <Text>{formatCurrency(Number(ms.amount || 0))}</Text>
                                <Text style={{ color: colors.muted }}>{ms.dueDate ? formatDate(ms.dueDate) : '—'}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Notes */}
                {order.notes && (
                    <View style={s.notesBox}>
                        <Text style={s.notesTitle}>GHI CHÚ</Text>
                        <Text style={s.notesText}>{order.notes}</Text>
                    </View>
                )}

                {/* Signature */}
                <View style={s.signatureRow}>
                    <View style={s.signatureBox}>
                        <Text style={s.signatureLabel}>ĐẠI DIỆN BÊN A</Text>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>{order.partnerName}</Text>
                    </View>
                    <View style={s.signatureBox}>
                        <Text style={s.signatureLabel}>ĐẠI DIỆN BÊN B</Text>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>Trần Thị Hằng — Giám Đốc</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Cty TNHH Võ Trọng Nghĩa — {docTitle} {order.name}</Text>
                    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
