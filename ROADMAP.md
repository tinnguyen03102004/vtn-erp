# Roadmap

> VTN ERP Development Roadmap — 2026

## Vision

Xây dựng hệ thống ERP nội bộ hoàn chỉnh cho công ty kiến trúc, quản lý toàn bộ chuỗi nghiệp vụ từ Lead đến Payment, tối ưu hóa bằng AI.

```
Lead → Quotation → Contract → Project → Phases → Milestones → Invoice → Payment
                                          └→ Tasks → Timesheet → Payroll
```

---

## Phase 0: Foundation ✅ (Completed — Q1 2026)

- [x] Next.js 16 App Router setup
- [x] Supabase PostgreSQL + RLS
- [x] Server-side auth (HMAC sessions)
- [x] RBAC permission matrix (5 roles × 13 permissions)
- [x] ActionResult<T> error handling pattern
- [x] Zod input validation
- [x] Audit logging
- [x] 205 unit tests passing
- [x] CRM E2E tests (Playwright)

## Phase 1: Core Modules ✅ (Completed — Q1 2026)

### CRM ✅
- [x] Kanban board with drag-and-drop
- [x] Lead detail page
- [x] Lead → Quotation conversion
- [x] Stage pipeline management

### Sales ✅
- [x] Quotation CRUD with service lines
- [x] Milestone management
- [x] Quotation → Contract conversion
- [x] PDF export (quotation, contract, invoice)
- [x] Contract → Project conversion

### Projects ✅
- [x] Project list + detail views
- [x] Phase management
- [x] Task management
- [x] Budget tracking

### Finance ✅
- [x] Invoice CRUD
- [x] Payment recording
- [x] Milestone → Invoice flow
- [x] Invoice state machine (DRAFT → POSTED → PAID)

### HR & Timesheets ✅
- [x] Employee management
- [x] Weekly timesheet grid
- [x] Per-project hour logging

## Phase 2: Payroll & Data Completion 🔄 (In Progress — Q2 2026)

### Payroll Module
- [x] Database tables (payroll_periods, payroll_slips)
- [x] Server actions (generate, confirm, pay)
- [x] Vietnamese insurance calculation (BHXH, BHYT, BHTN)
- [x] PIT calculation with dependents
- [ ] Seed salary data for demo employees
- [ ] Payroll slip PDF export
- [ ] Bank transfer integration (VietQR)

### Data Completion
- [ ] Seed project tasks (currently 0)
- [ ] Seed payments (currently 0)
- [ ] Seed attachments (currently 0)
- [ ] Employee salary data for payroll

### Reports Enhancement
- [ ] Excel export functionality
- [ ] Role-based report views (not just DIRECTOR)
- [ ] Monthly comparison charts

## Phase 3: Quality & DevOps 📋 (Planned — Q2 2026)

### Testing
- [ ] Server action test coverage: 38% → 100%
- [ ] E2E tests for all modules (Projects, Finance, Payroll, HR)
- [ ] Performance testing

### DevOps
- [ ] GitHub Actions CI/CD pipeline
- [ ] Docker development environment
- [ ] Staging environment
- [ ] Automated deployment

### Documentation
- [ ] Architecture decision records (ADR)
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Development guides

## Phase 4: Advanced Features 🔮 (Planned — Q3 2026)

### Notifications
- [ ] In-app notification system
- [ ] Email notifications (invoice due, task assigned)
- [ ] Zalo/Telegram integration

### AI Enhancement
- [ ] AI-powered cost estimation (improved)
- [ ] Automatic report generation
- [ ] Smart lead scoring
- [ ] Document OCR & extraction

### Mobile
- [ ] Responsive mobile UI
- [ ] PWA support
- [ ] Mobile timesheet entry

## Phase 5: Enterprise Features 🏢 (Future)

### Multi-tenant
- [ ] Organization management
- [ ] Tenant isolation
- [ ] Custom branding per tenant

### Advanced Finance
- [ ] Accounting integration
- [ ] Tax reporting (Vietnamese standards)
- [ ] Budget vs Actual tracking
- [ ] Cash flow projection

### Compliance
- [ ] Vietnam e-Invoice integration
- [ ] Government reporting formats
- [ ] Data retention policies

---

## Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp vào roadmap.

## Feedback

Nếu bạn có ý tưởng cho roadmap, hãy tạo [Feature Request](https://github.com/tinnguyen03102004/vtn-erp/issues/new?template=feature_request.md).
