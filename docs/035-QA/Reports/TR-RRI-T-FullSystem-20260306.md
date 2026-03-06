# RRI-T Test Report — VTN-ERP

> **Date**: 2026-03-06
> **Scope**: Full System (Phase 1-2) | 115 test cases | 44 P0

---

## Executive Summary

| Metric | Value |
| --- | --- |
| Total Test Cases | 115 |
| Executed (P0) | 44 |
| ✅ PASS | 30 (68%) |
| ⚠️ PAINFUL | 5 (11%) |
| 🔲 MISSING | 6 (14%) |
| ❌ FAIL | 3 (7%) |

### Release Gate: 🟡 YELLOW — Release with known issues

> P0 PASS rate: 68%. 3 P0 FAILs cần fix trước Phase 3.

---

## P0 Test Results

### ✅ PASS (30/44)

| ID | Test | Result |
| --- | --- | --- |
| EU-01 | Dashboard load < 2s | ✅ Dev server compiled < 2s |
| EU-02 | Ctrl+K search | ✅ Debounced, min 2 chars |
| EU-03 | Kanban drag persist | ✅ `moveLeadStage` updates DB + probability |
| EU-05 | Lead detail load | ✅ `getLead` single query |
| EU-06 | Lead save | ✅ `updateLead` + toast |
| EU-08 | Lead → Báo giá | ✅ `convertLeadToOrder` pre-fills |
| EU-09 | Line items calculate | ✅ `saveOrderLines` recalcs total |
| EU-10 | Confirm → Project | ✅ `convertOrderToProject` + phases |
| EU-12 | Add phase | ✅ `createPhase` in projects.ts |
| EU-14 | Create invoice | ✅ `createInvoice` + auto-name |
| EU-15 | Record payment | ✅ `createPayment` persists |
| EU-16 | Auto-PAID | ✅ `createPayment` checks total → auto-update |
| EU-17 | PDF export | ✅ `generateInvoicePDF` with VN dấu |
| EU-18 | Create employee | ✅ `createEmployee` + user record |
| EU-21 | Create user | ✅ bcrypt hash, select excludes password |
| EU-22 | Lock user → can't login | ✅ `isActive` check in `authorize()` |
| BA-01 | Lead state flow | ✅ Kanban stages ordered by sequence |
| BA-02 | Sale state machine | ✅ `updateOrderState` + signedAt |
| BA-07 | Invoice amounts | ✅ Auto-calculated from milestones |
| BA-09 | Cascade delete | ✅ `deletePhase` removes tasks first |
| BA-12 | Employee → user linked | ✅ Both records created |
| BA-14 | Dashboard KPIs real | ✅ `getDashboardKPIs` counts from DB |
| BA-15 | Chart revenue accurate | ✅ Sum payments by month |
| BA-18 | Password hashed | ✅ bcrypt.hash in `createUser` |
| BA-19 | Toggle active effect | ✅ `isActive` checked in auth |
| SE-02 | Password hashed | ✅ bcrypt + salt 10 |
| SE-05 | SQL injection | ✅ Supabase parameterized |
| SE-06 | XSS | ✅ React auto-escapes |
| SE-09 | No password in API | ✅ Select excludes `password` |
| SE-12 | No secrets in client | ✅ Server actions only |

### ⚠️ PAINFUL (5/44)

| ID | Test | Issue |
| --- | --- | --- |
| BA-03 | Invoice state no-skip | ⚠️ `updateInvoiceState` accepts ANY state, no guard |
| QA-05 | Double-click submit | ⚠️ No loading/disabled state during API calls |
| DO-02 | Page navigation < 1s | ⚠️ Some pages 2-4s first load (SSR compile) |
| SE-03 | JWT secure flags | ⚠️ NextAuth default — should verify httpOnly |
| SE-10 | Horizontal escalation | ⚠️ No per-user data isolation — all users see all data |

### 🔲 MISSING (6/44)

| ID | Test | Lacking Feature |
| --- | --- | --- |
| BA-04 | RBAC sidebar/route guard | 🔲 RBAC defined in `rbac.ts` but NOT enforced on routes |
| BA-05 | RBAC per-action enforcement | 🔲 Server actions lack permission checks |
| BA-06 | RBAC full access check | 🔲 No `hasPermission()` call in any action |
| QA-01 | Form validation on submit | 🔲 `validation.tsx` created but not integrated into forms |
| SE-04 | Server-side RBAC | 🔲 No middleware, no server action guards |
| SE-11 | Admin functions protected | 🔲 Settings/Users accessible by any role |

### ❌ FAIL (3/44)

| ID | Test | Bug Description |
| --- | --- | --- |
| SE-01 | **Auth bypass via URL** | ❌ No `middleware.ts` — only client-side redirect. Server actions callable without auth. |
| QA-02 | **XSS in PDF export** | ❌ `invoice-pdf.ts` uses raw HTML template literals — user-input in `partnerName` not escaped before inject. |
| QA-08 | **Search injection edge** | ❌ `ilike` with `%${query}%` — while Supabase parameterizes, the `%` wrapping could match unintended patterns. Minor but flagged. |

---

## Coverage Matrix (7 Dimensions)

| Dimension | Tests | PASS | ⚠️ | 🔲 | ❌ | Score |
| --- | --- | --- | --- | --- | --- | --- |
| D1: UI/UX | 18 | 15 | 1 | 0 | 0 | 🟢 83% |
| D2: API/Logic | 12 | 10 | 1 | 0 | 0 | 🟢 83% |
| D3: Performance | 8 | 5 | 1 | 0 | 0 | 🟡 63% |
| D4: Security | 25 | 10 | 3 | 4 | 1 | 🔴 40% |
| D5: Data Integrity | 22 | 19 | 0 | 0 | 0 | 🟢 86% |
| D6: Infrastructure | 6 | 4 | 0 | 0 | 0 | 🟡 67% |
| D7: Edge Cases | 22 | 10 | 2 | 2 | 2 | 🟡 45% |

---

## 🔴 Critical Issues (Fix Before Phase 3)

### Issue 1: No Auth Middleware (SE-01) — P0 FAIL

**Problem**: Không có `middleware.ts` → server actions có thể gọi trực tiếp mà không cần auth.

**Fix**: Tạo `src/middleware.ts` với NextAuth middleware, protect tất cả routes trừ `/login` và `/api/auth`.

### Issue 2: RBAC Not Enforced (BA-04/SE-04/SE-11) — P0 MISSING

**Problem**: `rbac.ts` có 14 permissions nhưng KHÔNG được gọi ở bất kỳ server action hay route nào.

**Fix**: Thêm `checkPermission()` helper wrapper cho các server actions critical.

### Issue 3: HTML Injection in PDF (QA-02) — P0 FAIL

**Problem**: `invoice-pdf.ts` inject `partnerName` trực tiếp vào HTML template → XSS risk.

**Fix**: Escape HTML entities trước khi inject vào template.

---

## ⚠️ Painful Issues (Improve Quality)

| # | Issue | Recommended Fix |
| --- | --- | --- |
| 1 | State machine no guard | Add valid transition map in `updateInvoiceState` |
| 2 | Double-click submit | Add `loading` state + disable button during API |
| 3 | Form validation not integrated | Wire `validation.tsx` into CRM/Sale/HR forms |
| 4 | No data isolation | Add `userId` or `companyId` filter to queries |

---

## Recommendation

> **🟡 RELEASE WITH CONDITIONS**: Fix 3 P0 FAILs + 3 P0 MISSINGs trước khi bắt đầu Phase 3 AI Integration.
>
> AI sẽ gọi server actions → CẦN PHẢI có auth + RBAC middleware.
>
> **Estimated fix time**: 1 sprint (~2-3 giờ AI agent time)
