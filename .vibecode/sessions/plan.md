# Execution Plan: VTN ERP — Tech Debt Cleanup

## 🎯 Objective

Hoàn thiện tech debt — type safety, validation consistency, testing, CI/CD
→ Production-ready code quality cho dev team.

## 📦 Deliverables from Contract

| # | Item | Acceptance Criteria |
|---|------|---------------------|
| 1 | ActionResult consistency | Mọi action file trả ActionResult + Zod parse |
| 2 | Type safety | Xóa 28 `: any`, thống nhất types |
| 3 | Lint pass | ESLint pass trên toàn codebase |
| 4 | Unit tests | Server actions + RBAC + Auth tests (Vitest) |
| 5 | E2E tests | Playwright: login → CRM → sale flow |
| 6 | CI/CD | GitHub Actions: lint → test → build |

## 🔧 Execution Steps

### Phase 1: ActionResult Consistency (this session)

1. `invoice-pdf.ts` → convert `throw new Error` → `ActionResult` pattern
2. `dashboard.ts` → wrap 4 functions với error handling + ActionResult
3. `search.ts` → wrap `globalSearch` với error handling + ActionResult  
4. `crm.ts` → replace `ActionResult<any>` with proper `Record<string, unknown>`
5. `attachments.ts` → replace `ActionResult<any>` with proper types
6. `auth-guard.ts` / `session.ts` → evaluate throw usage (auth guards keep throw by design)

### Phase 2: Type Safety & Lint

1. Scan 28 files for `: any` → replace with proper types
2. Remove `validation.tsx` → use Zod schemas everywhere
3. Fix ESLint pass

### Phase 3: Testing Coverage

1. Unit tests: server actions (mock Supabase)
2. Unit tests: RBAC permission matrix
3. Unit tests: Auth session module
4. E2E: Playwright (login → CRM → create lead → convert)

### Phase 4: CI/CD Pipeline

1. GitHub Actions: lint → test → build on PR

## ⏱️ Estimated Time

| Phase | Ước lượng |
|-------|-----------|
| Phase 1 | ~30 min |
| Phase 2 | ~45 min |
| Phase 3 | ~60 min |
| Phase 4 | ~20 min |
| **Total** | **~2.5 hours** |
