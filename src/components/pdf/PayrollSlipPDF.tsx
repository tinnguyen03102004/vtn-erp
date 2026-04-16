/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    ],
})

const c = {
    primary: '#1F3A5F',
    accent: '#C9A84C',
    text: '#0F1C2E',
    muted: '#8FA3BF',
    border: '#E2E8F0',
    bg: '#F8F9FB',
    white: '#ffffff',
    green: '#10B981',
    red: '#EF4444',
    orange: '#F59E0B',
}

const s = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: c.text },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    companyName: { fontSize: 16, fontWeight: 700, color: c.primary },
    companyInfo: { fontSize: 8, color: c.muted, marginTop: 3 },
    docBadge: { backgroundColor: c.primary, color: c.white, padding: '6 14', borderRadius: 4, fontSize: 11, fontWeight: 700, alignSelf: 'flex-start' as any },
    docSub: { fontSize: 10, fontWeight: 600, color: c.primary, marginTop: 6, textAlign: 'right' as any },
    docDate: { fontSize: 9, color: c.muted, marginTop: 2, textAlign: 'right' as any },
    divider: { borderBottomWidth: 1.5, borderBottomColor: c.accent, marginBottom: 20 },

    // Summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    summaryBox: { width: '30%', padding: 12, backgroundColor: c.bg, borderRadius: 6, alignItems: 'center' as any },
    summaryLabel: { fontSize: 8, fontWeight: 700, color: c.muted, textTransform: 'uppercase' as any, letterSpacing: 0.8 },
    summaryValue: { fontSize: 16, fontWeight: 700, marginTop: 4 },

    // Table
    table: { marginBottom: 16 },
    tableHeader: { flexDirection: 'row', backgroundColor: c.primary, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 4 },
    tableHeaderText: { color: c.white, fontSize: 8, fontWeight: 700 },
    tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: c.border },
    tableRowAlt: { backgroundColor: c.bg },
    totalRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1.5, borderTopColor: c.accent },

    // Columns — payroll table
    colName: { width: '22%' },
    colDept: { width: '12%' },
    colGross: { width: '11%', textAlign: 'right' as any },
    colBhxh: { width: '9%', textAlign: 'right' as any },
    colBhyt: { width: '8%', textAlign: 'right' as any },
    colBhtn: { width: '8%', textAlign: 'right' as any },
    colPit: { width: '10%', textAlign: 'right' as any },
    colDeduct: { width: '10%', textAlign: 'right' as any },
    colNet: { width: '10%', textAlign: 'right' as any },

    // Footer
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
    footerText: { fontSize: 7, color: c.muted },

    // Signature
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    signatureBox: { width: '30%', alignItems: 'center' as any },
    signatureLabel: { fontSize: 9, fontWeight: 700, color: c.muted, marginBottom: 40 },
    signatureLine: { borderBottomWidth: 1, borderBottomColor: c.text, width: '100%', marginBottom: 4 },
    signatureName: { fontSize: 8, color: c.muted },

    // Notes
    notesBox: { marginTop: 16, padding: 10, backgroundColor: c.bg, borderRadius: 6 },
    notesTitle: { fontSize: 8, fontWeight: 700, color: c.muted, marginBottom: 4 },
    notesText: { fontSize: 9, color: c.text, lineHeight: 1.5 },
})

function fmt(val: number) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val))
}

function fmtCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'VNĐ')
}

const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

type PayrollSlip = {
    grossSalary: number
    bhxhEmployee: number
    bhytEmployee: number
    bhtnEmployee: number
    pitAmount: number
    totalDeductions: number
    netSalary: number
    allowances: number
    employee: {
        department: string
        position: string
        user: { name: string; email: string }
    } | null
}

type PayrollPeriodPDF = {
    month: number
    year: number
    state: string
    totalGross: number
    totalDeductions: number
    totalNet: number
    slipCount: number
    notes: string | null
    slips: PayrollSlip[]
}

export default function PayrollSlipPDF({ period }: { period: PayrollPeriodPDF }) {
    const slips = period.slips || []
    const stateLabel = period.state === 'PAID' ? 'ĐÃ CHI' : period.state === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'NHÁP'
    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.companyName}>CÔNG TY TNHH VÕ TRỌNG NGHĨA</Text>
                        <Text style={s.companyInfo}>Số 23 Đường 55, KP1, P. Cát Lái, TP. Hồ Chí Minh</Text>
                        <Text style={s.companyInfo}>ĐT: (028) 6287 4411 • MST: 0303506388</Text>
                    </View>
                    <View>
                        <Text style={s.docBadge}>BẢNG LƯƠNG</Text>
                        <Text style={s.docSub}>{monthNames[period.month]} / {period.year}</Text>
                        <Text style={s.docDate}>Trạng thái: {stateLabel}</Text>
                        <Text style={s.docDate}>Ngày xuất: {dateStr}</Text>
                    </View>
                </View>

                <View style={s.divider} />

                {/* Summary */}
                <View style={s.summaryRow}>
                    <View style={s.summaryBox}>
                        <Text style={s.summaryLabel}>Tổng Gross</Text>
                        <Text style={[s.summaryValue, { color: c.primary }]}>{fmtCurrency(Number(period.totalGross || 0))}</Text>
                    </View>
                    <View style={s.summaryBox}>
                        <Text style={s.summaryLabel}>Tổng Khấu Trừ</Text>
                        <Text style={[s.summaryValue, { color: c.red }]}>{fmtCurrency(Number(period.totalDeductions || 0))}</Text>
                    </View>
                    <View style={s.summaryBox}>
                        <Text style={s.summaryLabel}>Thực Nhận</Text>
                        <Text style={[s.summaryValue, { color: c.green }]}>{fmtCurrency(Number(period.totalNet || 0))}</Text>
                    </View>
                </View>

                {/* Payroll Table */}
                <View style={s.table}>
                    <View style={s.tableHeader}>
                        <Text style={[s.tableHeaderText, s.colName]}>Nhân viên</Text>
                        <Text style={[s.tableHeaderText, s.colDept]}>Phòng ban</Text>
                        <Text style={[s.tableHeaderText, s.colGross]}>Gross</Text>
                        <Text style={[s.tableHeaderText, s.colBhxh]}>BHXH</Text>
                        <Text style={[s.tableHeaderText, s.colBhyt]}>BHYT</Text>
                        <Text style={[s.tableHeaderText, s.colBhtn]}>BHTN</Text>
                        <Text style={[s.tableHeaderText, s.colPit]}>Thuế TNCN</Text>
                        <Text style={[s.tableHeaderText, s.colDeduct]}>Khấu trừ</Text>
                        <Text style={[s.tableHeaderText, s.colNet]}>Thực nhận</Text>
                    </View>
                    {slips.map((slip, i) => (
                        <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                            <View style={s.colName}>
                                <Text style={{ fontWeight: 500 }}>{slip.employee?.user?.name || '—'}</Text>
                                <Text style={{ fontSize: 7, color: c.muted }}>{slip.employee?.position || ''}</Text>
                            </View>
                            <Text style={[s.colDept, { fontSize: 8, color: c.muted }]}>{slip.employee?.department || '—'}</Text>
                            <Text style={s.colGross}>{fmt(slip.grossSalary)}</Text>
                            <Text style={[s.colBhxh, { color: c.orange }]}>{fmt(slip.bhxhEmployee)}</Text>
                            <Text style={[s.colBhyt, { color: c.orange }]}>{fmt(slip.bhytEmployee)}</Text>
                            <Text style={[s.colBhtn, { color: c.orange }]}>{fmt(slip.bhtnEmployee)}</Text>
                            <Text style={[s.colPit, { color: c.red }]}>{fmt(slip.pitAmount)}</Text>
                            <Text style={[s.colDeduct, { color: c.red }]}>{fmt(slip.totalDeductions)}</Text>
                            <Text style={[s.colNet, { fontWeight: 700, color: c.green }]}>{fmt(slip.netSalary)}</Text>
                        </View>
                    ))}
                    {/* Total row */}
                    <View style={s.totalRow}>
                        <Text style={[s.colName, { fontWeight: 700 }]}>Tổng ({slips.length} NV)</Text>
                        <Text style={s.colDept}></Text>
                        <Text style={[s.colGross, { fontWeight: 700 }]}>{fmt(slips.reduce((a, sl) => a + sl.grossSalary, 0))}</Text>
                        <Text style={[s.colBhxh, { fontWeight: 700, color: c.orange }]}>{fmt(slips.reduce((a, sl) => a + sl.bhxhEmployee, 0))}</Text>
                        <Text style={[s.colBhyt, { fontWeight: 700, color: c.orange }]}>{fmt(slips.reduce((a, sl) => a + sl.bhytEmployee, 0))}</Text>
                        <Text style={[s.colBhtn, { fontWeight: 700, color: c.orange }]}>{fmt(slips.reduce((a, sl) => a + sl.bhtnEmployee, 0))}</Text>
                        <Text style={[s.colPit, { fontWeight: 700, color: c.red }]}>{fmt(slips.reduce((a, sl) => a + sl.pitAmount, 0))}</Text>
                        <Text style={[s.colDeduct, { fontWeight: 700, color: c.red }]}>{fmt(slips.reduce((a, sl) => a + sl.totalDeductions, 0))}</Text>
                        <Text style={[s.colNet, { fontWeight: 700, color: c.green }]}>{fmt(slips.reduce((a, sl) => a + sl.netSalary, 0))}</Text>
                    </View>
                </View>

                {/* Notes */}
                {period.notes && (
                    <View style={s.notesBox}>
                        <Text style={s.notesTitle}>GHI CHÚ</Text>
                        <Text style={s.notesText}>{period.notes}</Text>
                    </View>
                )}

                {/* Signatures */}
                <View style={s.signatureRow}>
                    <View style={s.signatureBox}>
                        <Text style={s.signatureLabel}>KẾ TOÁN</Text>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>Người lập bảng</Text>
                    </View>
                    <View style={s.signatureBox}>
                        <Text style={s.signatureLabel}>TRƯỞNG PHÒNG HR</Text>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>Kiểm soát</Text>
                    </View>
                    <View style={s.signatureBox}>
                        <Text style={s.signatureLabel}>GIÁM ĐỐC</Text>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>Phê duyệt</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Cty TNHH Võ Trọng Nghĩa — Bảng lương {monthNames[period.month]}/{period.year}</Text>
                    <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Trang ${pageNumber}/${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
