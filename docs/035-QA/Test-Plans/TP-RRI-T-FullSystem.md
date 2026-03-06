# RRI-T Test Plan — VTN-ERP

> **Module**: Full System (Phase 1-2 complete)
> **Scope**: 8 modules, 44+ server actions, 5 roles
> **Date**: 2026-03-06

---

## Scope

| Module | Actions | Components | Status |
| --- | --- | --- | --- |
| CRM | 7 | CRMKanban, LeadDetail | ✅ Phase 1 |
| Sale | 9 | SaleDetail | ✅ Phase 1 |
| Projects | 9 | ProjectDetail | ✅ Phase 1 |
| Finance | 5 | InvoiceDetail | ✅ Phase 1 |
| HR | 2 | EmployeesGrid | ✅ Phase 2 |
| Timesheets | 4 | TimesheetGrid | ✅ Phase 2 |
| User/RBAC | 4 | UserManagement | ✅ Phase 2 |
| Settings | 2 | SettingsContent | ✅ Phase 2 |
| Dashboard | 3 | DashboardCharts | ✅ Phase 2 |
| Search | 1 | GlobalSearch | ✅ Phase 2 |

### Roles (5)

| Role | Permissions | Users |
| --- | --- | --- |
| DIRECTOR | All 14 | 1 |
| PROJECT_MANAGER | CRM + Sale + Project + HR | ~5 |
| ARCHITECT | Projects + Timesheets | ~20 |
| FINANCE | Finance + Reports | 2 |
| SALES | CRM + Sale | 2 |

### P0 Critical Paths

1. Login → Dashboard → CRM Kanban → Create Lead → Move Stage
2. Lead → Báo giá → Sale Order → Confirm → Create Project
3. Project → Add Phase → Add Task → Assign → Mark Done
4. Invoice → Post → Record Payment → Auto-PAID
5. Employee Create → Login → Role-based Access
6. Timesheet → Log Hours → Save to DB
7. Settings → Save Company Info → PDF Export uses it

---

## Phase 2: DISCOVER — 5 Persona Rounds

### Round 1: 👤 End User (30 test ideas)

| # | Q | Expected | P | Dim |
| --- | --- | --- | --- | --- |
| EU-01 | Mở app, dashboard load bao lâu? | < 2s, hiển thị KPIs + charts | P0 | D3 |
| EU-02 | Tìm lead "Nguyễn" bằng Ctrl+K? | Kết quả xuất hiện < 500ms | P0 | D1 |
| EU-03 | Kéo lead từ "Leads mới" → "Đàm phán"? | Stage update persist DB | P0 | D1 |
| EU-04 | Tạo lead mới, thiếu tên → submit? | Hiển thị lỗi "Tên là bắt buộc" | P1 | D7 |
| EU-05 | Click lead → xem chi tiết? | Load detail page < 1s | P0 | D1 |
| EU-06 | Sửa lead info → Save? | Toast "Đã lưu", data persist | P0 | D5 |
| EU-07 | Xoá lead → xác nhận? | Confirm dialog → remove from Kanban | P1 | D1 |
| EU-08 | Tạo báo giá từ lead? | Pre-fill partner info | P0 | D5 |
| EU-09 | Thêm line items vào báo giá? | Tính tổng tự động | P0 | D5 |
| EU-10 | Confirm báo giá → tạo project? | Project auto-generated với phases | P0 | D5 |
| EU-11 | Xem projects → filter theo state? | Grid cập nhật đúng | P1 | D1 |
| EU-12 | Thêm phase mới vào project? | Phase hiện trong danh sách | P0 | D5 |
| EU-13 | Thêm task, tick checkbox? | Task state update | P1 | D1 |
| EU-14 | Tạo invoice từ project? | Amount pre-filled, partner auto | P0 | D5 |
| EU-15 | Post invoice → Record payment? | Payment lưu, progress bar update | P0 | D5 |
| EU-16 | Pay đủ → invoice auto PAID? | State chuyển, badge update | P0 | D5 |
| EU-17 | Xuất PDF invoice? | Print dialog, tiếng Việt đúng dấu | P0 | D1 |
| EU-18 | Tạo nhân viên mới? | User + employee record created | P0 | D5 |
| EU-19 | Log timesheet 8h? | Save to DB, toast confirm | P1 | D5 |
| EU-20 | Thay đổi settings công ty → Save? | Persist, PDF dùng đúng info | P1 | D5 |
| EU-21 | Tạo user mới ở Settings? | User login được với credentials | P0 | D5 |
| EU-22 | Lock user → user đó login? | Login bị từ chối | P0 | D4 |
| EU-23 | Dashboard → click "Xem tất cả" lead? | Navigate đúng trang | P2 | D1 |
| EU-24 | Mobile: mở CRM kanban? | Cards stack vertical, readable | P1 | D1 |
| EU-25 | Responsive: table trên mobile? | Horizontal scroll, no cut-off | P1 | D1 |
| EU-26 | VND hiển thị "1.234.567 đ"? | Đúng format separators | P1 | D7 |
| EU-27 | Toast notification hiện bao lâu? | 3-5s, auto dismiss, closeable | P2 | D1 |
| EU-28 | Breadcrumb navigation → back? | Đúng route, state maintained | P2 | D1 |
| EU-29 | Quick actions trên Dashboard? | Navigate correctly | P2 | D1 |
| EU-30 | Logout → redirect login? | Session cleared, redirect | P1 | D4 |

### Round 2: 📋 Business Analyst (25 test ideas)

| # | Q | Expected | P | Dim |
| --- | --- | --- | --- | --- |
| BA-01 | Lead state flow: New→Contact→Propose→Negotiate→Won? | Only valid transitions | P0 | D2 |
| BA-02 | Sale Order: DRAFT→SENT→SALE→DONE? | State machine correct | P0 | D2 |
| BA-03 | Invoice: DRAFT→POSTED→PAID, no skip? | Cannot go DRAFT→PAID directly | P0 | D2 |
| BA-04 | RBAC: Architect role → thấy Finance? | Không có quyền truy cập | P0 | D4 |
| BA-05 | RBAC: Sales → tạo project? | Permission denied | P0 | D4 |
| BA-06 | RBAC: Director → full access? | All 14 permissions granted | P0 | D4 |
| BA-07 | Invoice amount = sum(milestones)? | Data integrity check | P0 | D5 |
| BA-08 | Payment > invoice total? | Reject hoặc warning | P1 | D5 |
| BA-09 | Delete phase → cascade delete tasks? | All child tasks removed | P0 | D5 |
| BA-10 | Sale Order cancel → project state? | Independent, no auto-cancel | P1 | D2 |
| BA-11 | Lead won → chuyển đúng pipeline? | Stage counter update | P1 | D5 |
| BA-12 | Employee create → user auto-created? | 2 records linked | P0 | D5 |
| BA-13 | Timesheet date range filter? | Only show dates in range | P1 | D2 |
| BA-14 | Dashboard KPIs = actual data count? | Real-time accurate numbers | P0 | D5 |
| BA-15 | Chart revenue = sum(payments by month)? | Exact match | P0 | D5 |
| BA-16 | Project status pie chart = actual? | Count per state matches DB | P1 | D5 |
| BA-17 | PDF invoice uses company settings? | Name, address, email correct | P1 | D5 |
| BA-18 | Password hashed in DB? | Not stored plain text | P0 | D4 |
| BA-19 | User toggle active → immediate effect? | Can't login if locked | P0 | D4 |
| BA-20 | Duplicate lead name allowed? | Yes, warn if similar | P2 | D7 |
| BA-21 | Empty project → show "Chưa có"? | Graceful empty state | P2 | D1 |
| BA-22 | 30 users concurrently? | System handles | P1 | D3 |
| BA-23 | Settings page loads saved values? | Pre-fill from DB | P1 | D5 |
| BA-24 | createdAt auto-set on create? | Timestamp correct | P1 | D5 |
| BA-25 | Search result type labels correct? | Lead/Order/Project/Invoice/NV | P2 | D1 |

### Round 3: 🔍 QA Destroyer (30 test ideas)

| # | Q | Expected | P | Dim |
| --- | --- | --- | --- | --- |
| QA-01 | Submit form with all empty fields? | Validation errors shown | P0 | D7 |
| QA-02 | Input `<script>alert(1)</script>` in name? | Sanitized, no XSS | P0 | D4 |
| QA-03 | Negative number in invoice amount? | Rejected | P1 | D7 |
| QA-04 | Very long text (10000 chars) in note? | Truncate or accept | P1 | D7 |
| QA-05 | Double-click submit button? | Prevent duplicate | P0 | D7 |
| QA-06 | Navigate away mid-form → come back? | Data warned | P2 | D1 |
| QA-07 | Invalid email format in lead? | Validation error | P1 | D7 |
| QA-08 | SQL injection via search: `%; DROP TABLE`? | No injection | P0 | D4 |
| QA-09 | Access /projects/invalid-uuid? | 404, no crash | P1 | D7 |
| QA-10 | Access /finance without FINANCE role? | Redirect or 403 | P0 | D4 |
| QA-11 | Browser back after delete? | No stale data | P2 | D7 |
| QA-12 | Refresh page mid-operation? | State from DB | P1 | D7 |
| QA-13 | Concurrent edit same lead? | Last write wins | P1 | D7 |
| QA-14 | Create 100 leads rapidly? | No timeout | P2 | D3 |
| QA-15 | Future date for invoice? | Allowed | P2 | D7 |
| QA-16 | Payment of 0 đ? | Rejected | P1 | D7 |
| QA-17 | Unicode emoji in lead name? | Accepted | P2 | D7 |
| QA-18 | Very long partner name overflow? | Ellipsis | P1 | D1 |
| QA-19 | Delete all phases from project? | Empty state | P2 | D7 |
| QA-20 | Toggle user active twice quickly? | Correct final state | P1 | D7 |
| QA-21 | Create employee with existing email? | Error shown | P1 | D7 |
| QA-22 | Timesheet > 24h in one day? | Warning | P1 | D7 |
| QA-23 | Login with wrong password 10x? | No crash | P2 | D4 |
| QA-24 | API direct call without auth? | 401 | P0 | D4 |
| QA-25 | Session expired → action? | Redirect login | P1 | D4 |
| QA-26 | Empty search query? | No results, no error | P2 | D7 |
| QA-27 | Search with 1 char? | Min 2 chars | P2 | D7 |
| QA-28 | PDF export → dấu tiếng Việt? | "Nguyễn" correct | P0 | D7 |
| QA-29 | Kanban drag to same column? | No change, no error | P2 | D7 |
| QA-30 | Dashboard with 0 data? | Empty state | P1 | D7 |

### Round 4: 🛠️ DevOps (15 test ideas)

| # | Q | Expected | P | Dim |
| --- | --- | --- | --- | --- |
| DO-01 | App cold start time? | < 5s first paint | P1 | D3 |
| DO-02 | Page navigation latency? | < 1s between routes | P0 | D3 |
| DO-03 | Supabase connection failure? | Graceful error | P1 | D6 |
| DO-04 | Build production → errors? | 0 errors | P0 | D6 |
| DO-05 | ENV vars missing → startup? | Clear error | P1 | D6 |
| DO-06 | Memory usage stable? | No leaks | P2 | D3 |
| DO-07 | API response time? | < 500ms p95 | P1 | D3 |
| DO-08 | Static assets cached? | Cache headers | P2 | D3 |
| DO-09 | Database queries optimized? | No N+1 | P1 | D3 |
| DO-10 | Error logging present? | Errors logged | P2 | D6 |
| DO-11 | HTTPS enforced? | TLS required | P0 | D4 |
| DO-12 | Next.js SSR working? | Server render | P1 | D6 |
| DO-13 | Auth session timeout? | Auto-logout | P2 | D4 |
| DO-14 | Hot reload working? | < 2s reflect | P2 | D6 |
| DO-15 | Bundle size? | < 500KB JS | P2 | D3 |

### Round 5: 🔒 Security (15 test ideas)

| # | Q | Expected | P | Dim |
| --- | --- | --- | --- | --- |
| SE-01 | Auth bypass via URL? | Redirect login | P0 | D4 |
| SE-02 | Password stored hashed? | bcrypt | P0 | D4 |
| SE-03 | JWT token secure? | httpOnly cookie | P0 | D4 |
| SE-04 | RBAC server-side? | Not just client hide | P0 | D4 |
| SE-05 | SQL injection via search? | Parameterized | P0 | D4 |
| SE-06 | XSS via input fields? | Escaped output | P0 | D4 |
| SE-07 | CSRF protection? | SameSite cookie | P1 | D4 |
| SE-08 | Rate limiting login? | Brute force prevented | P1 | D4 |
| SE-09 | User data in API? | No password hash | P0 | D4 |
| SE-10 | Horizontal escalation? | User isolation | P0 | D4 |
| SE-11 | Admin protected? | DIRECTOR only | P0 | D4 |
| SE-12 | Secrets in client? | No env in JS | P0 | D4 |
| SE-13 | CORS configured? | No wildcard | P1 | D4 |
| SE-14 | File upload? | N/A currently | — | D4 |
| SE-15 | Audit trail? | Phase 3 scope | P2 | D4 |

---

## Totals

| Persona | Count | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| 👤 End User | 30 | 14 | 10 | 6 |
| 📋 Business Analyst | 25 | 10 | 10 | 5 |
| 🔍 QA Destroyer | 30 | 7 | 11 | 12 |
| 🛠️ DevOps | 15 | 3 | 6 | 6 |
| 🔒 Security | 15 | 10 | 3 | 1 |
| **TOTAL** | **115** | **44** | **40** | **30** |
