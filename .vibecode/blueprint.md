# 📘 BLUEPRINT: VTN ERP — Tech Debt Cleanup

## DASHBOARD - Vibecode Kit v4.0

---

### 📋 PROJECT INFO

| Field | Value |
|-------|-------|
| Dự án | VTN Architecture ERP |
| Loại | DASHBOARD (ERP hybrid) |
| Ngày | 2026-03-09 |
| Job ID | JOB-001 |

---

### 🎯 MỤC TIÊU

**Primary Goal:** Hoàn thiện tech debt — type safety, validation consistency, testing, CI/CD
**Target Audience:** Dev team (onboarding, maintenance)
**Key Message:** Production-ready code quality

---

### 📐 STRUCTURE (4 Phases)

```
Phase 1: ActionResult Consistency
├── invoice-pdf.ts → convert throw → ActionResult
├── dashboard.ts → add ActionResult wrapping
├── search.ts → add ActionResult wrapping
└── All mutations → Zod parse (already done: sale, finance, projects, employees)

Phase 2: Type Safety & Lint
├── 28 files → replace `: any` with proper types
├── Remove validation.tsx → use Zod schemas
└── Fix ESLint pass

Phase 3: Testing Coverage
├── Unit: server actions (mock Supabase)
├── Unit: RBAC permission matrix
├── Unit: Auth session module
└── E2E: Playwright (login → CRM → create lead → convert)

Phase 4: CI/CD Pipeline
└── GitHub Actions: lint → test → build on PR
```

---

### 💻 TECH STACK

- Next.js 16 + TypeScript + Tailwind v4
- Supabase (PostgreSQL) + Prisma (schema)
- Vitest (unit) + Playwright (E2E)
- GitHub Actions (CI/CD)

---

### ✅ CHECKPOINT

- [x] Structure đúng mong muốn
- [x] Scope phù hợp
- [x] Không thiếu gì quan trọng

**Status: APPROVED** ✅
