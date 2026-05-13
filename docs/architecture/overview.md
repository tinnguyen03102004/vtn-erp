# Architecture Overview

## System Architecture

VTN ERP là một **modular monolith** chạy trên Next.js 16 App Router, kết nối Supabase PostgreSQL.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│    React 19 + Radix UI + Recharts + Tailwind CSS 4          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│                   Next.js App Router                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes   │  │  Server  │  │   API    │  │  Proxy   │   │
│  │  (Pages)  │  │ Actions  │  │  Routes  │  │ (Auth)   │   │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └──────────┘   │
│                      │             │                         │
│  ┌──────────────────▼─────────────▼──────────────────────┐  │
│  │              Data Access Layer                         │  │
│  │    Supabase JS (primary)  │  Prisma (schema/model)    │  │
│  └──────────────────┬────────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    PostgreSQL 17.6                            │
│              Supabase (ap-southeast-1)                       │
│     24 tables │ RLS enabled │ Audit logging                  │
└─────────────────────────────────────────────────────────────┘
```

## Module Architecture

```
Dashboard ──── Reports
    │              ▲
    ▼              │
CRM ──→ Sales ──→ Projects ──→ Finance
                    │              │
                    ▼              ▼
              Timesheets      Payments
                    │
                    ▼
                Payroll
```

### Module Responsibilities

| Module | Route | Actions File | Tables |
|--------|-------|-------------|--------|
| CRM | `/crm` | `crm.ts` | `crm_stages`, `crm_leads` |
| Sales | `/sale` | `sale.ts` | `sale_orders`, `sale_order_lines`, `sale_milestones` |
| Projects | `/projects` | `projects.ts` | `projects`, `project_phases`, `project_tasks` |
| Finance | `/finance` | `finance.ts` | `invoices`, `payments` |
| HR | `/employees` | `employees.ts` | `users`, `employees` |
| Timesheets | `/timesheets` | `timesheets.ts` | `timesheets` |
| Payroll | `/payroll` | `payroll.ts` | `payroll_periods`, `payroll_slips` |
| Reports | `/reports` | `dashboard.ts` | (aggregates all) |
| AI | `/api/ai/chat` | `ai/tools.ts` | (uses all modules) |
| Settings | `/settings` | `settings.ts` | `settings` |

## Auth Architecture

See [README Section 8](../../README.md#8-auth-flow) for detailed auth flow.

**Summary**: Server-side HMAC-signed sessions → `app_sessions` table → bcrypt password hashing → RBAC permission matrix.

## Data Flow

```
User Action → Server Action → Supabase JS → PostgreSQL → Response → UI Update
```

All mutations go through:
1. `requireAuth()` — Verify session
2. `requirePermission()` — Check RBAC
3. Zod validation — Validate input
4. Business logic — Execute operation
5. `logAudit()` — Record audit trail
6. `ActionResult<T>` — Return typed result

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | 17.6 |
| Data Access | Supabase JS | 2.98.x |
| Schema | Prisma | 7.4.x |
| Styling | Tailwind CSS | 4.x |
| AI | OpenAI Chat Completions | - |
| PDF | @react-pdf/renderer | 4.3.x |
| Charts | Recharts | 3.7.x |
| Icons | Lucide React | 0.577.x |
