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

## Phase 2: Payroll, Attendance & Data Completion ✅ (Completed — Q2 2026)

### Payroll Module ✅
- [x] Database tables (payroll_periods, payroll_slips)
- [x] Server actions (generate, confirm, pay)
- [x] Vietnamese insurance calculation (BHXH, BHYT, BHTN)
- [x] PIT calculation with dependents
- [x] Seed salary data for all 21 employees
- [x] Payroll slip PDF export (landscape A4, CSV fallback)
- [x] VietQR bank transfer integration (QR code in pay modal)

### Attendance Module ✅
- [x] Database tables (attendance_periods, attendance_records)
- [x] Excel import from attendance machine
- [x] Attendance → Payroll integration (work days ratio)
- [x] RLS enabled on all tables

### Data Completion ✅
- [x] 29 project tasks seeded
- [x] 4 payment records seeded
- [x] 21 employees with salary data (13M-45M VND)

### Reports Enhancement ✅
- [x] CSV/Excel export functionality (`/api/reports/export`)
- [x] Role-based report views (DIRECTOR, PM, FINANCE)
- [x] Payroll summary in reports page

## Phase 3: Quality & DevOps ✅ (Completed — Q2 2026)

### Testing
- [x] Server action test coverage: 15/15 actions (283 tests passing)
- [x] E2E tests for critical flows (Playwright: auth, CRM, navigation, sale — 5 spec files)
- [ ] ~Performance testing~ (deferred — premature before production load)

### DevOps
- [x] GitHub Actions CI/CD pipeline (5 gates: Lint → Typecheck → Test → Build)
- [x] Docker development environment (multi-stage Dockerfile + docker-compose)
- [x] Staging environment (Vercel Preview Deployments — auto on every PR)
- [x] Automated deployment (Vercel auto-deploy on push to `main`)

### Documentation
- [x] Architecture decision records (6 ADRs: Next.js, HMAC sessions, Supabase, Payroll, Attendance, RLS)
- [x] API documentation (`docs/api/README.md` — all 15 action modules + API routes)
- [x] Database schema documentation (`docs/database/schema.md` — 24 tables, ER diagrams)
- [x] Development guides (`docs/guides/getting-started.md` + `contributing.md`)

## Phase 4: Advanced Features 🔄 (In Progress — Q3 2026)

### Notifications
- [x] In-app notification system (notifications table + bell UI + polling)
- [ ] Email notifications (invoice due, task assigned)
- [ ] Zalo/Telegram integration

### AI Enhancement
- [x] AI-powered cost estimation (estimate_price + analyze_quotation tools)
- [ ] Automatic report generation
- [ ] Smart lead scoring
- [ ] Document OCR & extraction

### Mobile
- [x] PWA support (manifest.json + meta tags + standalone mode)
- [ ] Responsive mobile UI optimization
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
