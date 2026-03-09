# ═══════════════════════════════════════════════════════

# 🔧 CODER PACK

# VTN ERP — Tech Debt Cleanup

# ═══════════════════════════════════════════════════════

## ⚠️ QUY TẮC TUYỆT ĐỐI

1. KHÔNG thay đổi kiến trúc / layout
2. KHÔNG thêm features không có trong Contract
3. KHÔNG đổi tech stack
4. Gặp conflict → BÁO CÁO, không tự quyết định

## 🎯 PROJECT GOAL (Quick Reference)

**Primary Goal:** Hoàn thiện tech debt — type safety, validation consistency, testing, CI/CD
**Target Audience:** Dev team (onboarding, maintenance)
**Key Message:** Production-ready code quality

## 📜 CONTRACT (LOCKED)

### ✅ DELIVERABLES

| # | Item | Chi tiết |
|---|------|----------|
| 1 | ActionResult consistency | Mọi action file trả ActionResult + Zod parse |
| 2 | Type safety | Xóa 28 `any`, thống nhất types |
| 3 | Lint pass | ESLint pass trên toàn codebase |
| 4 | Unit tests | Server actions + RBAC + Auth tests |
| 5 | E2E tests | Playwright: login → CRM → sale flow |
| 6 | CI/CD | GitHub Actions: lint → test → build |

### ⚠️ KHÔNG BAO GỒM

- Thêm features mới
- Thay đổi UI/UX
- Database migration
- Refactor kiến trúc

**Confirmed:** Chủ nhà confirmed — "LGTM"

## 📘 BLUEPRINT REFERENCE

### Structure (4 Phases)

```
Phase 1: ActionResult Consistency
├── invoice-pdf.ts → convert throw → ActionResult
├── dashboard.ts → add ActionResult wrapping
├── search.ts → add ActionResult wrapping
└── crm.ts, attachments.ts → replace ActionResult<any> with proper types

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

### Tech Stack

- Next.js 16 + TypeScript + Tailwind v4
- Supabase (PostgreSQL) + Prisma (schema)
- Vitest (unit) + Playwright (E2E)
- GitHub Actions (CI/CD)

## 🔧 BUILD INSTRUCTIONS

### Pattern Reference: ActionResult

```typescript
// action-result.ts (existing)
export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; fieldErrors?: Record<string, string> }

export function ok<T>(data: T): ActionResult<T>
export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never>
```

### Pattern: Mutation functions (existing pattern from sale.ts)

```typescript
export async function createX(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('x.edit')
    const parsed = parseInput(schema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)

    const { data, error } = await supabase.from('x').insert(parsed.data).select().single()
    if (error) return fail(error.message)

    await logAudit({ ... })
    return ok(data)
}
```

### Pattern: Read-only functions (need wrapping for Phase 1)

```typescript
// Before (current):
export async function getX() {
    const { data } = await supabase.from('x').select('*')
    return data || []
}

// After (Phase 1 - wrap with try/catch for consistency):
// NOTE: Read functions currently return raw data directly.
// Phase 1 ONLY converts throw patterns + replaces `any`.
// Read functions keep their current return types for backward compat.
```

### Rules

- Build theo Blueprint chính xác
- Không deviate từ contract
- Test mỗi deliverable theo acceptance criteria
- `auth-guard.ts` throws → KEEP (auth guards throw by design, caught at page level)
- `session.ts` throw → KEEP (session creation is infrastructure)
- `AttachmentPanel.tsx` throw → KEEP (client component, caught by try/catch in event handler)

## ✅ Completion Checklist

### Phase 1: ActionResult Consistency

- [x] `invoice-pdf.ts` → throw → ActionResult
- [x] `dashboard.ts` → error handling consistent
- [x] `search.ts` → error handling consistent
- [x] `crm.ts` → `ActionResult<any>` → `ActionResult<Record<string, unknown>>`
- [x] `attachments.ts` → `ActionResult<any>` → `ActionResult<Record<string, unknown>>`

### Phase 2: Type Safety

- [x] ~35 instances `: any` → proper types (server actions, tools, validators, catch clauses)
- [x] `validation.tsx` → refactored `any` → `unknown` (kept file, added type guards)
- [ ] ESLint pass (deferred — no eslint config in project)

### Phase 3: Testing

- [x] Vitest: ActionResult helpers (10 tests)
- [x] Vitest: Zod schemas (27 tests)
- [x] Vitest: RBAC permission matrix (27 tests)
- [x] Vitest: Validation utilities (29 tests)
- [x] Vitest: Utils functions (22 tests)
- [x] Vitest: Auth session HMAC (4 tests)
- [ ] Playwright: login → CRM flow (deferred — needs Playwright setup)

### Phase 4: CI/CD

- [x] GitHub Actions workflow file (`.github/workflows/ci.yml` — tsc → lint → test → build)
