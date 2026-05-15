# Finance Module — E2E Test Spec

## Module Routes
- `/invoices` — Invoice listing
- `/invoices/new` — Create invoice
- `/invoices/[id]` — Invoice detail
- `/payments` — Payment listing
- `/reports` — Financial reports

## Business Flow
```
Milestone Due → Create Invoice → Send to Client → Record Payment → Update Balance
```

## Test Scenarios

### Invoice Management
1. **View Invoices** — Login as FINANCE → Navigate to `/invoices` → Assert list renders
2. **Create Invoice** — Select project/milestone → Auto-populate amount → Save
3. **Invoice Detail** — Click invoice → Assert line items, total, tax
4. **Invoice Status** — Draft → Sent → Paid → Assert badge updates
5. **Print Invoice** — Click print/PDF → Assert document generated
6. **VAT Calculation** — Assert 10% VAT applied correctly

### Payment Recording
7. **Record Payment** — Link to invoice → Enter amount, date, method → Save
8. **Partial Payment** — Pay less than invoice total → Assert remaining balance
9. **Full Payment** — Pay full amount → Assert invoice status → Paid
10. **Payment Methods** — Test bank transfer, cash, VietQR options

### Financial Reports
11. **Revenue Report** — Select date range → Assert totals match invoices
12. **Outstanding Report** — Assert lists unpaid invoices with aging
13. **Cash Flow** — Assert income vs expenses timeline

### Integration
14. **Milestone → Invoice** — Complete milestone → Create invoice → Assert amount matches
15. **Invoice → Payment → Balance** — Full cycle: invoice → pay → verify balance zero

### Edge Cases
16. **Duplicate Payment** — Prevent paying more than invoice total
17. **Currency Formatting** — Assert VND formatting (e.g., 1.500.000 ₫)
18. **Date Range Edge** — Cross-month queries → Assert correct grouping
