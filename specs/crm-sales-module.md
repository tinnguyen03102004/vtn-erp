# CRM & Sales Module — E2E Test Spec

## Module Routes
- `/crm` — CRM Pipeline (Kanban board)
- `/crm/leads` — Lead listing
- `/crm/leads/new` — Create new lead
- `/sale-orders` — Sale Orders listing
- `/sale-orders/new` — Create quotation
- `/sale-orders/[id]` — Sale Order detail

## Business Flow
```
Lead → Qualify → Quotation → Negotiate → Contract → Won/Lost
```

## Test Scenarios

### CRM Pipeline
1. **View Pipeline** — Login → Navigate to `/crm` → Assert Kanban stages visible
2. **Create Lead** — Fill lead form (company, contact, value) → Assert lead appears in pipeline
3. **Move Lead Stage** — Drag lead to next stage → Assert stage updated
4. **Edit Lead** — Click lead → Edit details → Save → Assert updated
5. **Delete Lead** — Delete a lead → Assert removed from pipeline

### Sale Orders (Quotations)
6. **Create Quotation** — Navigate to `/sale-orders/new` → Fill client, services, amounts → Save
7. **Add Service Lines** — Add multiple service lines with unit price and quantity → Assert total calculated
8. **Add Milestones** — Add payment milestones with percentages → Assert sum = 100%
9. **Print PDF** — Click PDF button → Assert PDF generated
10. **Status Flow** — Draft → Sent → Confirmed → Assert status badge updates
11. **Convert to Contract** — Confirm quotation → Assert creates linked project

### Edge Cases
12. **Empty Quotation** — Try to save without required fields → Assert validation errors
13. **Duplicate Lead** — Create lead with same email → Assert warning or prevention
14. **Large Values** — Test with billion-VND values → Assert number formatting correct
