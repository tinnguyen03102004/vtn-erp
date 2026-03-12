# 🔬 PROJECT X-RAY: VTN Architecture ERP

> Generated: 2026-03-10 | Updated: 2026-03-12
> By: VibeCoding Kit v4.0 — XRAY Protocol (Post-Upgrade)

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Quick Start](#2-quick-start)
3. [Architecture](#3-architecture)
4. [Key Components](#4-key-components)
5. [API Reference](#5-api-reference)
6. [Database Schema](#6-database-schema)
7. [Environment Variables](#7-environment-variables)
8. [Deployment](#8-deployment)
9. [Common Tasks](#9-common-tasks)
10. [Troubleshooting](#10-troubleshooting)
11. [Code Health Assessment](#11-code-health-assessment)
12. [Technical Debt & Upgrade Recommendations](#12-technical-debt--upgrade-recommendations)

---

## 1. Overview

### What is this project?

VTN Architecture ERP is an **Odoo-inspired enterprise resource planning system** built for an architecture firm. It manages the full business cycle: CRM (leads/opportunities) → Sales (quotations/contracts) → Projects (phases/tasks) → Finance (invoices/payments) → HR (employees/timesheets). Includes an **AI assistant** powered by OpenAI for natural-language ERP operations.

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | ^5 |
| UI Library | React | 19.2.3 |
| Styling | Vanilla CSS (Design System) | Custom |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | 7.4.2 |
| Auth | Custom session-based (bcryptjs + cookies) | — |
| AI | OpenAI (via Vercel AI SDK) | ai ^6.0 |
| Charts | Recharts | 3.7.0 |
| PDF | @react-pdf/renderer | 4.3.2 |
| UI Primitives | Radix UI | Various |
| Testing | Vitest (unit) + Playwright (E2E) | 4.0 / 1.58 |
| Deployment | Vercel | — |

### Project History

- Created: ~2025
- Last XRAY: 2026-03-06
- Current XRAY: 2026-03-10 (Upgrade Planning focus)

---

## 2. Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** (ships with Node.js)
- **Supabase** project with PostgreSQL database
- **OpenAI API key** (for AI assistant)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd vtn-erp

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values (see Section 7)

# Push database schema
npx prisma db push

# Seed initial data (CRM stages, admin user, etc.)
# → handled by app's first-run logic or manual SQL

# Run development server
npm run dev
# Open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

---

## 3. Architecture

### Directory Structure

```
vtn-erp/
├── prisma/
│   └── schema.prisma          # 16 models, 464 lines
├── src/
│   ├── app/
│   │   ├── globals.css        # TailwindCSS v4 + design tokens (19KB)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home → redirects to dashboard
│   │   ├── login/             # Login page
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── layout.tsx     # Dashboard layout (sidebar + header)
│   │   │   ├── dashboard/     # Main dashboard with KPIs
│   │   │   ├── crm/           # CRM Kanban + lead detail
│   │   │   ├── sale/          # Quotations/Contracts
│   │   │   ├── projects/      # Project management
│   │   │   ├── timesheets/    # Timesheet grid
│   │   │   ├── finance/       # Invoices
│   │   │   ├── employees/     # Employee management
│   │   │   ├── reports/       # Reports & analytics
│   │   │   └── settings/      # App settings
│   │   └── api/
│   │       ├── ai/            # AI chat endpoint (Vercel AI SDK)
│   │       ├── auth/          # Login / Logout / Session
│   │       ├── pdf/           # PDF generation
│   │       └── upload/        # File upload (Supabase Storage)
│   ├── components/            # 16 components
│   │   ├── shared/            # Header, Sidebar
│   │   ├── ai/                # ChatDataTable, ChatMetricCard
│   │   ├── pdf/               # SaleOrderPDF
│   │   └── [Feature].tsx      # Feature-specific components
│   └── lib/
│       ├── actions/           # 12 server action files
│       ├── ai/                # AI tools, system-prompt, quote-analysis
│       ├── __tests__/         # 6 unit test files
│       ├── prisma.ts          # Prisma client singleton
│       ├── supabase.ts        # Supabase client
│       ├── session.ts         # Session management
│       ├── auth-guard.ts      # Route protection
│       ├── rbac.ts            # Role-based access control
│       ├── schemas.ts         # Zod validation schemas
│       ├── types.ts           # TypeScript type definitions
│       └── utils.ts           # Utility functions
├── e2e/                       # 3 Playwright test specs
├── docs/                      # Project documentation
└── public/                    # Static assets
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │  Dashboard   │  │  CRM/Sale   │  │   AI Chat (useChat hook)   │ │
│  │   Charts     │  │  Kanban     │  │  ← Vercel AI SDK streaming │ │
│  └──────┬───────┘  └──────┬──────┘  └──────────────┬──────────────┘ │
└─────────┼─────────────────┼────────────────────────┼────────────────┘
          │                 │                        │
          ▼                 ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS 16 SERVER                               │
│  ┌──────────────────────┐  ┌───────────────────────────────────────┐│
│  │   Server Actions     │  │        API Routes                     ││
│  │  (12 action files)   │  │  /api/ai   → OpenAI streaming         ││
│  │  dashboard, crm,     │  │  /api/auth → login/logout/session     ││
│  │  sale, projects,     │  │  /api/pdf  → @react-pdf generation    ││
│  │  finance, employees  │  │  /api/upload → Supabase Storage       ││
│  └──────────┬───────────┘  └──────────────┬────────────────────────┘│
│             │                             │                         │
│  ┌──────────▼─────────────────────────────▼────────────────────────┐│
│  │                    LIB LAYER                                    ││
│  │  session.ts → auth-guard.ts → rbac.ts → schemas.ts (Zod)       ││
│  │  prisma.ts → Prisma Client     supabase.ts → Storage           ││
│  │  ai/tools.ts → 15 AI tools     ai/quote-analysis.ts            ││
│  └──────────┬──────────────────────────────┬───────────────────────┘│
└─────────────┼──────────────────────────────┼────────────────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────┐    ┌────────────────────────────────────────┐
│  Supabase PostgreSQL │    │      Supabase Storage                  │
│  (Prisma ORM)        │    │  (Attachments, Documents)              │
│  16 tables           │    │                                        │
└──────────────────────┘    └────────────────────────────────────────┘
```

### Data Flow

```
CRM Lead → Convert to Sale Order → Create Quotation → Send → Sign
         → Generate Contract → Create Project (phases + tasks)
         → Log Timesheets → Generate Invoices → Record Payments
```

---

## 4. Key Components

### Feature Components (src/components/)

| Component | Size | Purpose |
|-----------|------|---------|
| `SaleDetail.tsx` | 29KB / ~680 lines | Full sale order/quotation editor with lines, milestones, state machine, PDF export |
| `ChatPanel.tsx` | 24KB / ~580 lines | AI assistant chat with tool result rendering (tables, cards, confirmations) |
| `ProjectDetail.tsx` | 16KB | Project management — phases, tasks, kanban-style board |
| `CRMKanban.tsx` | 15KB | CRM pipeline with drag-and-drop Kanban columns |
| `EmployeesGrid.tsx` | 13KB | Employee directory with CRUD operations |
| `InvoiceDetail.tsx` | 13KB | Invoice viewer with payment tracking |
| `SalePageTabs.tsx` | 12KB | Tab navigation for quotations/contracts |
| `LeadDetail.tsx` | 10KB | CRM lead detail panel |
| `AttachmentPanel.tsx` | 11KB | File upload/management via Supabase Storage |
| `UserManagement.tsx` | 9KB | User admin with role assignment |

### Layout Components (src/components/shared/)

| Component | Size | Purpose |
|-----------|------|---------|
| `Header.tsx` | 8KB | Top navigation bar with search, profile, notifications |
| `Sidebar.tsx` | 8KB | Collapsible sidebar with module navigation |

### AI Components (src/components/ai/)

| Component | Purpose |
|-----------|---------|
| `ChatDataTable.tsx` | Renders tabular AI tool results |
| `ChatMetricCard.tsx` | Renders metric cards from AI responses |

---

## 5. API Reference

### API Routes (src/app/api/)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai` | POST | AI chat streaming via Vercel AI SDK + OpenAI |
| `/api/auth/login` | POST | Email/password authentication |
| `/api/auth/logout` | POST | Session invalidation |
| `/api/auth/session` | GET | Current session check |
| `/api/pdf` | GET | Generate sale order PDF |
| `/api/upload` | POST | Upload files to Supabase Storage |

### Server Actions (src/lib/actions/)

| Module | File | Key Functions |
|--------|------|---------------|
| Dashboard | `dashboard.ts` | `getDashboardKPIs`, revenue/pipeline stats |
| CRM | `crm.ts` | `getStages`, `getLeads`, `createLead`, `updateLead`, `moveLead` |
| Sales | `sale.ts` (15KB) | `getSaleOrders`, `createSaleOrder`, `updateOrderState`, `addOrderLine`, `convertToContract`, `createProjectFromOrder` |
| Projects | `projects.ts` | `getProjects`, `createProject`, `createPhase`, `createTask`, `updateTask` |
| Timesheets | `timesheets.ts` | `getTimesheets`, `saveTimesheet`, `getTimesheetGrid` |
| Finance | `finance.ts` | `getInvoices`, `createInvoice`, `recordPayment` |
| Employees | `employees.ts` | `getEmployees`, `createEmployee`, `updateEmployee` |
| Attachments | `attachments.ts` | `getAttachments`, `deleteAttachment` |
| Search | `search.ts` | `globalSearch` — cross-module search |
| Users | `users.ts` | `getUsers`, `createUser`, `updateUser` |
| Settings | `settings.ts` | `getSettings`, `updateSettings` |
| PDF | `invoice-pdf.ts` | `generateInvoicePDF` |

---

## 6. Database Schema

### Models Overview (16 total)

```
AUTH MODULE:
  User ──┬── Account (OAuth providers)
         ├── Session (NextAuth sessions)
         └── AppSession (Custom Odoo-style sessions)

HR MODULE:
  Employee ←→ User (1:1)

CRM MODULE:
  CrmStage ──→ CrmLead[] (pipeline stages)
  CrmLead ──→ SaleOrder[] (conversion)

SALE MODULE:
  SaleOrder ──┬── SaleOrderLine[] (items)
              ├── SaleMilestone[] (payment milestones)
              └── Project[] (delivery projects)
  SaleOrder ──→ SaleOrder (self-ref: Contract → Quotation)

PROJECT MODULE:
  Project ──┬── ProjectPhase[] ──→ ProjectTask[]
            └── Timesheet[]

ACCOUNTING MODULE:
  Invoice ──→ Payment[]
  Invoice ←── SaleMilestone (milestone invoicing)

SUPPORT:
  Setting (key-value config)
  Attachment (polymorphic file attachments)
  VerificationToken (email verification)
```

### Key Relationships

```
CrmLead → SaleOrder → Project → Timesheet
                    ↘ SaleMilestone → Invoice → Payment
```

---

## 7. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase) |
| `AUTH_SECRET` | ✅ | Session token hashing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for AI assistant |

---

## 8. Deployment

### Vercel (Current)

1. Connect GitHub repo to Vercel
2. Set all environment variables (Section 7)
3. Build command: `npm run build` (auto-detected)
4. Output: `.next/` (auto-detected)

### Build Commands

```bash
npm run build     # Production build
npm start         # Start production server
```

---

## 9. Common Tasks

### Add a New Dashboard Module

1. Create route: `src/app/(dashboard)/[module]/page.tsx`
2. Create server actions: `src/lib/actions/[module].ts`
3. Create component: `src/components/[ModuleName].tsx`
4. Add Prisma model: `prisma/schema.prisma`
5. Run `npx prisma db push`
6. Add sidebar link: `src/components/shared/Sidebar.tsx`

### Add a New Server Action

1. Create/edit file in `src/lib/actions/`
2. Add `'use server'` directive at top
3. Use `requireAuth()` for protected actions
4. Use Zod schema for input validation
5. Return `ActionResult<T>` for consistent error handling

### Add AI Tool

1. Edit `src/lib/ai/tools.ts`
2. Define tool with Zod parameters
3. Add execute function
4. Tool auto-registers with AI SDK

---

## 10. Troubleshooting

### Common Issues

**Issue: Prisma connection timeout**

```
Error: Can't reach database server
```

**Solution:** Check `DATABASE_URL` in `.env.local`. Ensure Supabase project is active.

**Issue: Build fails with `bcryptjs` error**
**Solution:** Ensure `bcryptjs` is in `serverExternalPackages` in `next.config.ts`.

**Issue: AI assistant not responding**
**Solution:** Verify `OPENAI_API_KEY` is set and valid. Check `/api/ai` route.

---

## 11. Code Health Assessment

### 🟢 Healthy

| Indicator | Status |
|-----------|--------|
| TypeScript strict mode | ✅ Enabled |
| ESLint configured | ✅ `no-explicit-any: error` enforced |
| ESLint errors | ✅ **0 errors** |
| `tsc --noEmit` | ✅ **0 errors** |
| `npm run build` | ✅ **Passes** |
| `console.log` in production | ✅ **0 found** |
| TODO/FIXME in code | ✅ **0 found** |
| npm audit (production) | ✅ **0 vulnerabilities** |
| `.gitignore` covers secrets | ✅ `.env*` excluded |
| Input validation (Zod) | ✅ `schemas.ts` (5.7KB) |
| Auth RBAC | ✅ `rbac.ts` + `auth-guard.ts` |
| Error boundaries | ✅ 9 `error.tsx` + 10 `loading.tsx` across all routes |
| Server-side caching | ✅ `unstable_cache` for dashboard (KPIs 5min, lists 2min, charts 10min) |
| Test coverage | ✅ **181 tests** (11 test files, 56 server action tests) |
| Component health | ✅ Large components decomposed (SaleDetail, ChatPanel) |
| Shared UI components | ✅ `DataTable`, `StatusBadge`, `ConfirmDialog`, `ModuleError`, `ModuleLoading` |

### Codebase Metrics (Post-Upgrade 2026-03-12)

| Metric | Before | After |
|--------|--------|-------|
| Total TS/TSX files | 80 | 118 |
| Lines of code | ~9,772 | ~12,800 |
| Components | 16 | 30+ |
| Shared UI components | 2 | 7 |
| Server action files | 12 | 12 |
| API routes | 4 | 4 |
| Dashboard routes | 9 | 9 |
| Prisma models | 16 | 16 |
| Unit tests | 6 | 181 (11 files) |
| E2E tests | 3 | 3 |
| Error boundaries | 0 | 9 |
| Loading skeletons | 0 | 10 |

---

## 12. Technical Debt & Upgrade Recommendations

### Completed (Upgrade Sprint 2026-03-10 → 2026-03-12)

| Priority | Item | Status |
|----------|------|--------|
| P1 | Type Safety — Reduce `eslint-disable` | ✅ Shared `types.ts`, reduced file-level disables |
| P2 | Component Decomposition | ✅ SaleDetail (4 sub-components), ChatPanel (3 sub-components), Shared UI (5 components) |
| P3 | Test Coverage | ✅ 6 → 181 tests (56 server action tests across 5 modules) |
| P4 | Unused Variable Cleanup | ✅ Cleaned in Phase 1 |
| P5 | Package Updates | ✅ Updated |
| P6 | Architecture: Error boundaries | ✅ 9 error.tsx + 10 loading.tsx |
| P6 | Architecture: Caching | ✅ `unstable_cache` for dashboard |

### Remaining (Future)

| Area | Current | Recommended | Priority |
|------|---------|-------------|----------|
| Form handling | Manual `useState` | React Hook Form for `SaleDetail` | Low (works fine) |
| State management | Props drilling | Zustand for complex forms | Low |
| i18n | Hardcoded Vietnamese | `next-intl` if multi-language needed | Low |
| E2E Tests | 3 basic specs | Full Sales workflow E2E | Medium |
| Performance | No audit | Lighthouse / Core Web Vitals | Medium |
| Security | Basic auth | RLS review, API hardening | Medium |

---

*Generated by VibeCoding Kit v4.0 — XRAY Protocol*
*Updated: 2026-03-12 (Post-Upgrade)*
