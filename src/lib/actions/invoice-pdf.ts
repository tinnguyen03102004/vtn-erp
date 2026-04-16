'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/lib/supabase'
import { escapeHtml } from '@/lib/utils'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { formatVnd, numberToVietnameseWords, generateVietQrUrl } from '@vtn/vietnam'

export async function generateInvoicePDF(invoiceId: string): Promise<ActionResult<{ html: string; invoiceName: string }>> {
  // Fetch invoice + payments
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return fail('Invoice not found')

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('invoiceId', invoiceId)
    .order('paymentDate')

  // Fetch settings
  const { data: settings } = await supabase.from('settings').select('key, value')
  const settingsMap: Record<string, string> = {}
  for (const s of settings || []) if (s.key) settingsMap[s.key] = s.value ?? ''

  const stateLabels: Record<string, string> = {
    DRAFT: 'Nháp', POSTED: 'Ðã g?i', PAID: 'Ðã thanh toán', CANCELLED: 'Ðã hu?'
  }

  const totalPaid = (payments || []).reduce((s: number, p: Record<string, unknown>) => s + Number(p.amount || 0), 0)
  const remaining = Number(invoice.amountTotal || 0) - totalPaid

  // Escape user inputs to prevent XSS
  const e = (s: unknown) => escapeHtml(String(s ?? ''))

  // Generate HTML for PDF
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Hoá don ${invoice.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F1C2E; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1F3A5F; padding-bottom: 24px; }
  .company { }
  .company-name { font-size: 22px; font-weight: 800; color: #1F3A5F; margin-bottom: 4px; }
  .company-info { font-size: 12px; color: #4A5E78; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 800; color: #1F3A5F; margin-bottom: 12px; }
  .meta-row { font-size: 12px; color: #4A5E78; margin-bottom: 2px; }
  .meta-value { font-weight: 700; color: #0F1C2E; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .status-DRAFT { background: #F0F2F5; color: #4A5E78; }
  .status-POSTED { background: #EFF6FF; color: #2563EB; }
  .status-PAID { background: #F0FDF4; color: #16A34A; }
  .status-CANCELLED { background: #FEF2F2; color: #DC2626; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; color: #1F3A5F; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
  .partner-box { background: #F8F9FB; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
  .partner-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .partner-info { font-size: 12px; color: #4A5E78; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1F3A5F; color: #fff; padding: 10px 14px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 10px 14px; border-bottom: 1px solid #E2E8F0; }
  tr:last-child td { border-bottom: none; }
  .amount-col { text-align: right; font-weight: 600; }
  .total-row { background: #F8F9FB; }
  .total-row td { font-weight: 700; font-size: 15px; color: #1F3A5F; border-top: 2px solid #1F3A5F; }
  .footer { margin-top: 32px; border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #8FA3BF; text-align: center; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="company">
      <div class="company-name">${e(settingsMap['companyName'] || 'Công ty TNHH Võ Tr?ng Nghia')}</div>
      <div class="company-info">
        ${e(settingsMap['address'] || '')}<br>
        ${settingsMap['phone'] ? 'ÐT: ' + e(settingsMap['phone']) : ''}<br>
        ${settingsMap['email'] ? 'Email: ' + e(settingsMap['email']) : ''}
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">HOÁ ÐON</div>
      <div class="meta-row">S?: <span class="meta-value">${e(invoice.name ?? '')}</span></div>
      <div class="meta-row">Ngày: <span class="meta-value">${new Date(invoice.invoiceDate || invoice.createdAt || new Date()).toLocaleDateString('vi-VN')}</span></div>
      <div class="meta-row">H?n: <span class="meta-value">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : '-'}</span></div>
      <div style="margin-top: 8px;">
        <span class="status status-${invoice.state ?? 'DRAFT'}">${stateLabels[invoice.state ?? ''] || invoice.state}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Khách hàng</div>
    <div class="partner-box">
      <div class="partner-name">${e(invoice.partnerName || '-')}</div>
      <div class="partner-info">
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ${e((invoice as any).partnerAddress || '')}<br>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MST: ${e((invoice as any).partnerTaxId || '-')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Chi ti?t</div>
    <table>
      <thead>
        <tr>
          <th>Mô t?</th>
          <th class="amount-col">Thành ti?n</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <td>${e((invoice as any).description || invoice.name)}</td>
          <td class="amount-col">${formatVnd(Number(invoice.amountTotal || 0))}</td>
        </tr>
        <tr class="total-row">
          <td>TỔNG CỘNG</td>
          <td class="amount-col">${formatVnd(Number(invoice.amountTotal || 0))}</td>
        </tr>
        <tr>
          <td colspan="2" style="font-style:italic;font-size:12px;color:#4A5E78;">Bằng chữ: ${numberToVietnameseWords(Number(invoice.amountTotal || 0))}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${(payments || []).length > 0 ? `
  <div class="section">
    <div class="section-title">L?ch s? thanh toán</div>
    <table>
      <thead>
        <tr>
          <th>Ngày</th>
          <th>Hình th?c</th>
          <th>Ghi chú</th>
          <th class="amount-col">S? ti?n</th>
        </tr>
      </thead>
      <tbody>
        ${(payments || []).map((p: Record<string, unknown>) => `
        <tr>
          <td>${new Date(String(p.paymentDate)).toLocaleDateString('vi-VN')}</td>
          <td>${p.method === 'BANK' ? 'Chuy?n kho?n' : p.method === 'CASH' ? 'Ti?n m?t' : e(p.method || '-')}</td>
          <td>${e(p.note || '-')}</td>
          <td class="amount-col">${formatVnd(Number(p.amount || 0))}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td colspan="3">Ðã thanh toán</td>
          <td class="amount-col">${formatVnd(totalPaid)}</td>
        </tr>
        ${remaining > 0 ? `
        <tr>
          <td colspan="3" style="font-weight:700;color:#EF4444;">Còn l?i</td>
          <td class="amount-col" style="color:#EF4444;font-weight:700;">${formatVnd(remaining)}</td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${remaining > 0 && settingsMap['bankAccount'] ? `
  <div class="section">
    <div class="section-title">Thanh toán qua QR</div>
    <div style="text-align:center;">
      <img src="${generateVietQrUrl({
        bankBin: settingsMap['bankBin'] || '970422',
        accountNumber: settingsMap['bankAccount'],
        accountName: settingsMap['companyName'],
        amount: remaining,
        memo: invoice.name,
      })}" width="200" height="200" alt="VietQR" style="border-radius:8px;" />
      <div style="font-size:11px;color:#4A5E78;margin-top:8px;">${e(settingsMap['bankName'] || '')} - ${e(settingsMap['bankAccount'])}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    ${e(settingsMap['companyName'] || 'Cty TNHH Võ Trọng Nghĩa')} - Hoá đơn được tạo tự động bởi VTN ERP
  </div>
</body>
</html>`

  return ok({ html, invoiceName: invoice.name })
}
