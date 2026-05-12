# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Payroll module — `payroll_periods` + `payroll_slips` database tables
- Employee salary columns (`baseSalary`, `insurableSalary`, `region`, `dependents`, `allowances`)
- Root documentation: CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, ROADMAP, BRANDING, LICENSE
- CI/CD GitHub Actions pipeline
- Docker development environment

### Fixed
- Dashboard test mock missing `.order()` chaining after `.in()`
- npm audit vulnerabilities (19 → 5)

---

## [0.1.0] — 2026-03-09

### Added
- **Core Architecture**: Next.js 16 App Router modular monolith
- **Auth**: Server-side HMAC-signed sessions (Odoo-style) with RBAC
- **CRM Module**: Kanban board, lead management, stage pipeline, lead → quotation conversion
- **Sales Module**: Quotation/contract CRUD, service lines, milestones, PDF export
- **Projects Module**: Project management, phases, tasks, budget tracking
- **Finance Module**: Invoice CRUD, payment recording, milestone → invoice flow
- **HR Module**: Employee management, user ↔ employee linking
- **Timesheets Module**: Weekly grid, per-project hour logging
- **Reports Module**: Director-level KPI dashboard with real data
- **AI Assistant**: OpenAI tool-calling with 16 business tools (read + write)
- **Settings Module**: Company settings, user management

### Technical
- Supabase JS as primary data access (15+ action files)
- Prisma for schema modeling
- `ActionResult<T>` pattern for consistent error handling
- Zod schemas for input validation (205 tests passing)
- Audit logging (`logAudit()`) for critical operations
- RBAC permission matrix (5 roles × 13 permissions)
- Vietnam-specific packages: tax/insurance calculation, VietQR, currency formatting

### Infrastructure
- Supabase PostgreSQL 17.6 (20+ tables, all RLS enabled)
- Vercel deployment
- Turbo monorepo with 8 internal packages
- Playwright E2E tests (CRM flow)

---

## [0.0.1] — 2026-02-28

### Added
- Initial project scaffold with `create-next-app`
- Basic routing structure

[Unreleased]: https://github.com/tinnguyen03102004/vtn-erp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tinnguyen03102004/vtn-erp/releases/tag/v0.1.0
[0.0.1]: https://github.com/tinnguyen03102004/vtn-erp/releases/tag/v0.0.1
