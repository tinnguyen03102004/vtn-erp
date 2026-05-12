# Contributing to VTN ERP

Cảm ơn bạn đã quan tâm đến việc đóng góp cho VTN ERP! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)
- [Coding Standards](#coding-standards)

## Code of Conduct

Dự án này tuân theo [Code of Conduct](CODE_OF_CONDUCT.md). Bằng việc tham gia, bạn đồng ý tuân thủ các quy tắc ứng xử này.

## Getting Started

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- Supabase project (hoặc local PostgreSQL)
- OpenAI API key (optional, for AI features)

### Setup

```bash
# Clone repo
git clone https://github.com/tinnguyen03102004/vtn-erp.git
cd vtn-erp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

## Development Workflow

```
main ← feature/* ← your-branch
```

1. Tạo branch từ `main`: `git checkout -b feature/my-feature`
2. Code theo [Architecture Guidelines](#architecture-guidelines)
3. Viết tests (vitest cho unit, playwright cho E2E)
4. Commit theo [Commit Convention](#commit-convention)
5. Push và tạo Pull Request

## Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer(s)]
```

### Types

| Type | Mô tả |
|------|-------|
| `feat` | Tính năng mới |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons...) |
| `refactor` | Code refactoring (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding/fixing tests |
| `chore` | Build process, tooling, dependencies |
| `ci` | CI/CD changes |

### Scopes

| Scope | Module |
|-------|--------|
| `crm` | CRM & Leads |
| `sale` | Quotations & Contracts |
| `project` | Projects & Tasks |
| `finance` | Invoices & Payments |
| `payroll` | Payroll & Salary |
| `hr` | Employees |
| `timesheet` | Timesheets |
| `auth` | Authentication & RBAC |
| `ai` | AI Assistant |
| `ui` | UI Components |
| `db` | Database & Migrations |
| `infra` | Infrastructure |

### Examples

```bash
feat(crm): add lead source filter on kanban board
fix(finance): correct VAT calculation for zero-rated items
docs(api): document server actions reference
test(payroll): add unit tests for insurance calculation
chore(deps): bump next to 16.2.0
```

## Pull Request Process

1. **Title**: Follow commit convention format
2. **Description**: Fill in the PR template
3. **Checks**: Ensure all CI checks pass
   - `npm run lint` — No ESLint errors
   - `npm run typecheck` — No TypeScript errors
   - `npm test` — All vitest tests pass
   - `npm run build` — Build succeeds
4. **Review**: At least 1 approval required
5. **Merge**: Squash and merge to `main`

## Architecture Guidelines

### Project Structure

```
src/
├── app/(dashboard)/     # Route pages (server components)
├── lib/
│   ├── actions/         # Server actions (business logic)
│   ├── ai/              # AI tools & chat handler
│   └── *.ts             # Core utilities
├── components/
│   ├── shared/          # Reusable UI components
│   ├── ai/              # AI-specific components
│   └── pdf/             # PDF templates
packages/
├── vietnam/             # Vietnamese business logic (tax, insurance)
├── schemas/             # Zod validation schemas
├── shared/              # Shared types & utils
├── logger/              # Structured logging
├── auth/                # Auth utilities
├── audit/               # Audit logging
├── errors/              # Error handling
└── database/            # Database utilities
```

### Key Patterns

1. **Server Actions**: Tất cả mutations phải qua server actions với:
   - `requireAuth()` hoặc `requirePermission()` guard
   - `parseInput()` với Zod schema validation
   - `ActionResult<T>` return type
   - `logAudit()` cho hành động quan trọng

2. **Data Access**: Sử dụng Supabase JS (KHÔNG dùng Prisma cho runtime queries)

3. **Error Handling**: `ok(data)` / `fail(message)` pattern

4. **Type Safety**: Avoid `any` — use typed DTOs

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` in new code (use `unknown` + type narrowing)
- Use `interface` for object shapes, `type` for unions/intersections
- Google-style JSDoc for exported functions

### React

- Server Components by default
- Client Components only when needed (`'use client'`)
- No `useEffect` for data fetching — use server actions

### CSS

- Tailwind CSS 4 + global CSS variables
- No inline styles for reusable components
- Dark mode support via CSS variables

### Testing

- Vitest for unit tests (`src/lib/__tests__/`)
- Playwright for E2E tests (`e2e/`)
- Mock Supabase client for unit tests
- Test naming: `describe('functionName')` → `it('does something')`

---

## Questions?

Nếu có câu hỏi, hãy tạo [Discussion](https://github.com/tinnguyen03102004/vtn-erp/discussions) hoặc liên hệ team qua Slack.

Thank you for contributing! 🙏
