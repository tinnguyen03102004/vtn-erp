# 📜 CONTRACT: VTN ERP — Tech Debt Cleanup

## ✅ DELIVERABLES

| # | Item | Chi tiết |
|---|------|----------|
| 1 | ActionResult consistency | Mọi action file trả ActionResult + Zod parse |
| 2 | Type safety | Xóa 28 `any`, thống nhất types |
| 3 | Lint pass | ESLint pass trên toàn codebase |
| 4 | Unit tests | Server actions + RBAC + Auth tests |
| 5 | E2E tests | Playwright: login → CRM → sale flow |
| 6 | CI/CD | GitHub Actions: lint → test → build |

## 🛠️ TECH STACK

- Vitest (unit tests)
- Playwright (E2E)
- GitHub Actions (CI/CD)

## ⚠️ KHÔNG BAO GỒM

- Thêm features mới
- Thay đổi UI/UX
- Database migration
- Refactor kiến trúc

## ✅ CONFIRMED

Chủ nhà confirmed: 2026-03-09T12:20:58 — "LGTM"
