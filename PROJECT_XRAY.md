# 🔬 PROJECT X-RAY: VTN Architecture ERP

> Generated: 2026-03-05 | By: Vibecode Kit v4.0 — XRAY Protocol
> Purpose: **Onboarding + Upgrade Planning**

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Quick Start](#2-quick-start)
3. [Architecture](#3-architecture)
4. [Key Components](#4-key-components)
5. [Modules & Pages](#5-modules--pages)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [Environment Variables](#8-environment-variables)
9. [Code Health Assessment](#9-code-health-assessment)
10. [Technical Debt & Roadmap](#10-technical-debt--roadmap)

---

## 1. Overview

### What is this project?

**VTN-ERP** là hệ thống quản lý doanh nghiệp (ERP) thiết kế riêng cho **VTN Architects** — công ty kiến trúc ~30 nhân sự. Lấy cảm hứng từ Odoo, custom lại bằng Next.js + Supabase.

### Business Domain

- **Lead → Báo giá → Hợp đồng → Dự án → Thanh toán theo giai đoạn → Quyết toán**
- Quản lý dự án kiến trúc theo Phase (Ý tưởng → TK Cơ sở → TK Kỹ thuật → Thi công → Nghiệm thu)
- Milestone-based billing (thanh toán theo % hoàn thành)

### Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | **16.1.6** |
| Language | TypeScript | ^5 |
| UI Library | React | **19.2.3** |
| Styling | Tailwind CSS + Vanilla CSS | v4 |
| UI Components | Radix UI (14 packages) | Latest |
| Charts | Recharts | ^3.7.0 |
| Database | Supabase (PostgreSQL) via Prisma | Prisma 7.4.2 |
| Auth | NextAuth v5 (beta.30) | JWT + Credentials |
| Icons | Lucide React | ^0.577.0 |
| Utilities | date-fns, clsx, class-variance-authority, tailwind-merge | Latest |

### Current State: **MVP — UI Shell with Mock Data**

> ⚠️ **CRITICAL FINDING**: 100% dữ liệu hiện tại là **hardcoded mock data** trong từng page component. Chưa có kết nối DB thực. Auth dùng demo accounts plain-text.

---

## 2. Quick Start

### Prerequisites

- Node.js 18+
- npm (hoặc pnpm/yarn)
- Supabase account (nếu muốn kết nối DB thật)

### Installation

```bash
git clone [repo-url]
cd vtn-erp
npm install

# Copy environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

npm run dev
# Open http://localhost:3000
```

### Demo Login (Mock)

| Email | Password | Role |
|-------|----------|------|
| `director@vtn.vn` | `password123` | DIRECTOR |
| `pm@vtn.vn` | `password123` | PROJECT_MANAGER |
| `arch@vtn.vn` | `password123` | ARCHITECT |
| `finance@vtn.vn` | `password123` | FINANCE |
| `sales@vtn.vn` | `password123` | SALES |

---

## 3. Architecture

### Directory Structure

```
vtn-erp/
├── prisma/
│   └── schema.prisma         # 396 lines — 16 models, 5 modules
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (19 lines)
│   │   ├── page.tsx           # Home → redirect (4 lines)
│   │   ├── login/
│   │   │   └── page.tsx       # Login form (327 lines) ★ Largest page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Auth-guarded dashboard shell (52 lines)
│   │   │   ├── dashboard/page.tsx    # KPIs + Charts (346 lines)
│   │   │   ├── crm/page.tsx          # Kanban board (129 lines)
│   │   │   ├── crm/[id]/page.tsx     # Lead detail
│   │   │   ├── sale/page.tsx         # Orders list (95 lines)
│   │   │   ├── sale/new/page.tsx     # Create quote
│   │   │   ├── sale/[id]/page.tsx    # Order detail
│   │   │   ├── projects/page.tsx     # Projects list
│   │   │   ├── projects/[id]/page.tsx # Project detail
│   │   │   ├── employees/page.tsx    # Employee cards (115 lines)
│   │   │   ├── timesheets/page.tsx   # Weekly grid (124 lines)
│   │   │   ├── finance/page.tsx      # → redirect to invoices
│   │   │   ├── finance/invoices/page.tsx  # Invoice list
│   │   │   ├── reports/page.tsx      # Analytics dashboard (241 lines)
│   │   │   └── settings/page.tsx     # App settings (93 lines)
│   │   └── api/auth/
│   │       ├── signin/route.ts  # Demo auth (39 lines)
│   │       ├── signout/route.ts # Clear session (6 lines)
│   │       └── me/route.ts      # Get current user (13 lines)
│   ├── components/shared/
│   │   ├── Sidebar.tsx          # Navigation (173 lines)
│   │   └── Header.tsx           # Top bar + user menu (175 lines)
│   └── lib/
│       ├── auth.ts              # NextAuth config (54 lines)
│       ├── auth-context.tsx     # React auth context (56 lines)
│       ├── prisma.ts            # Prisma client singleton (10 lines)
│       └── utils.ts             # formatCurrency, formatDate, cn (44 lines)
├── public/                      # Static assets (5 files)
├── .env                         # Environment (placeholder values)
├── package.json
├── prisma.config.ts
└── next.config.ts
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │   Login      │  │         Dashboard Layout             │  │
│  │   Page       │  │  ┌──────────┐  ┌────────────────┐  │  │
│  │  (Public)    │  │  │ Sidebar  │  │  Header        │  │  │
│  └──────┬───────┘  │  │  (Nav)   │  │ (User/Search)  │  │  │
│         │          │  └──────────┘  └────────────────┘  │  │
│         │          │  ┌─────────────────────────────────┐│  │
│    ▼ POST         │  │        Page Content              ││  │
│  /api/auth/       │  │  (KPIs, Tables, Charts, Forms)  ││  │
│   signin          │  │  [ALL: Hardcoded Mock Data]       ││  │
│         │          │  └─────────────────────────────────┘│  │
│    ▼ Cookie       │  └──────────────────────────────────┘│  │
│  (vtn-session)    └──────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (NOT YET CONNECTED)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │   HR    │ │   CRM   │ │  Sale   │ │ Project │          │
│  │ Employee│ │ CrmLead │ │SaleOrder│ │ Project │          │
│  │ Leave   │ │CrmStage │ │OrderLine│ │ Phase   │          │
│  │         │ │         │ │Milestone│ │ Task    │          │
│  └─────────┘ └─────────┘ └─────────┘ │Timesheet│          │
│  ┌─────────┐                         └─────────┘          │
│  │  Auth   │  ┌─────────┐                                  │
│  │  User   │  │Accounting│                                  │
│  │ Account │  │ Invoice  │                                  │
│  │ Session │  │ Payment  │                                  │
│  └─────────┘  └─────────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow (Current — Mock)

```
User Action → Page Component → Hardcoded Mock Array → JSX Render
```

### Data Flow (Target)

```
User Action → Component → Server Action/API → Prisma → Supabase → Response → UI
```

---

## 4. Key Components

### Sidebar (`components/shared/Sidebar.tsx` — 173 lines)

- Navigation menu cho 9 modules: Dashboard, CRM, Sale, Projects, Employees, Timesheets, Finance, Reports, Settings
- Active state tự động theo pathname
- Branding VTN Architects

### Header (`components/shared/Header.tsx` — 175 lines)

- Search bar, notifications badge
- User dropdown menu (profile, settings, logout)
- Breadcrumb-like page title

### Dashboard Layout (`(dashboard)/layout.tsx` — 52 lines)

- Auth guard: redirect to `/login` nếu chưa đăng nhập
- Loading spinner VTN branded
- Wraps Sidebar + Header + children

---

## 5. Modules & Pages

| Module | Page | LOC | Data Source | Features |
|--------|------|-----|------------|----------|
| **Dashboard** | `/dashboard` | 346 | Mock | 4 KPI cards, Revenue chart (Recharts), Project pie chart, Recent projects table, Recent leads |
| **CRM** | `/crm` | 129 | Mock | 5-stage Kanban board, Pipeline KPIs, Lead cards with probability |
| **CRM** | `/crm/[id]` | ? | Mock | Lead detail view |
| **Sale** | `/sale` | 95 | Mock | Orders table, State badges, 4 KPIs |
| **Sale** | `/sale/new` | ? | Mock | Quote creation form |
| **Sale** | `/sale/[id]` | ? | Mock | Order detail + milestones |
| **Projects** | `/projects` | ? | Mock | Project list |
| **Projects** | `/projects/[id]` | ? | Mock | Project detail with phases |
| **Employees** | `/employees` | 115 | Mock | Employee card grid, Utilization bars, Dept summary |
| **Timesheets** | `/timesheets` | 124 | Mock (useState) | Weekly timesheet grid, Editable hours, Progress bar |
| **Finance** | `/finance/invoices` | ? | Mock | Invoice list |
| **Reports** | `/reports` | 241 | Mock | Revenue/Cost/Profit bar chart, Utilization bars, Cash flow forecast, Pie chart nguồn KH |
| **Settings** | `/settings` | 93 | Mock | App settings |
| **Login** | `/login` | 327 | Demo accounts | Login form with demo credentials |

---

## 6. API Reference

### Authentication (Custom — NOT using NextAuth handlers)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `POST /api/auth/signin` | POST | Login with demo accounts | None |
| `POST /api/auth/signout` | POST | Clear session cookie | Session |
| `GET /api/auth/me` | GET | Get current user from cookie | Session |

> ⚠️ Auth hiện tại dùng **plain-text password matching** + base64 session cookie. NextAuth v5 config có trong `lib/auth.ts` nhưng **chưa được sử dụng** (signin route dùng custom demo logic).

---

## 7. Database Schema

### Prisma Schema (`prisma/schema.prisma` — 396 lines, 16 models)

| Module | Models | Key Fields |
|--------|--------|-----------|
| **Auth** | User, Account, Session, VerificationToken | email, password (hashed), role (enum), isActive |
| **HR** | Employee, LeaveRequest | userId (→User), department, position, salary |
| **CRM** | CrmStage, CrmLead | pipeline stages, expectedRevenue, probability, source |
| **Sale** | SaleOrder, SaleOrderLine, SaleMilestone | totalAmount, state (DRAFT→SALE), milestone % + amount |
| **Project** | Project, ProjectPhase, ProjectTask, Timesheet | phases, tasks (assignee), hours logged per day |
| **Accounting** | Invoice, Payment | invoice type (OUT_INVOICE/REFUND), state, milestone link |

### Key Enums

- `UserRole`: DIRECTOR, PROJECT_MANAGER, ARCHITECT, FINANCE, SALES
- `ProjectState`: DRAFT, ACTIVE, PAUSED, DONE, CANCELLED
- `TaskState`: TODO, IN_PROGRESS, REVIEW, DONE
- `InvoiceState`: DRAFT, POSTED, PAID, CANCELLED
- `MilestoneState`: PENDING, INVOICED, PAID

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth JWT secret |
| `NEXTAUTH_URL` | Yes | App URL (<http://localhost:3000>) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase publishable key |

---

## 9. Code Health Assessment

### 🟡 NEEDS ATTENTION

| Area | Status | Detail |
|------|--------|--------|
| **Data Layer** | 🔴 | 100% mock data, no DB connection |
| **Auth Security** | 🔴 | Plain-text passwords, base64 cookie |
| **TypeScript** | 🟡 | Mostly typed, some `any` casts in auth callbacks |
| **Error Handling** | 🔴 | Minimal — no error boundaries, no API error handling |
| **Loading States** | 🟡 | Dashboard layout has spinner, pages don't |
| **Tests** | 🔴 | Zero test coverage |
| **ESLint** | 🟢 | Configured |
| **Responsive** | 🟡 | Basic responsive via CSS, not fully tested |
| **Console.logs** | 🟢 | None found in production code |
| **Commented Code** | 🟢 | Clean |
| **CSS Design System** | 🟢 | Comprehensive `globals.css` (18.7KB) with custom design tokens |

### Code Quality Score: **4/10** (UI Shell — Not Production Ready)

---

## 10. Technical Debt & Roadmap

### 🔴 Critical (Block Production)

- [ ] **Connect Prisma to Supabase** — Replace ALL mock data with DB queries
- [ ] **Implement NextAuth properly** — Replace demo cookie auth with JWT sessions
- [ ] **Add Server Actions/API routes** — CRUD operations for all modules
- [ ] **Seed database** — Create initial data migration
- [ ] **Input validation** — Add Zod schemas for all forms

### 🟡 Important (Before Beta)

- [ ] **Error boundaries** — Global + per-module error handling
- [ ] **Loading states** — Skeleton screens for all data-fetching pages
- [ ] **Role-based access control** — Restrict pages per UserRole
- [ ] **Form implementation** — Currently buttons exist but forms don't submit
- [ ] **Search/Filter functionality** — Search inputs exist but non-functional
- [ ] **Pagination** — Data tables need pagination for real data

### 🟢 Nice to Have (Post-Beta)

- [ ] **Dark mode** toggle
- [ ] **Client portal** (external access for clients)
- [ ] **AI-powered data entry** (via chat — planned in conversation ae567597)
- [ ] **Document management** — Upload BIM files, contracts
- [ ] **Notification system** — Real-time alerts
- [ ] **Mobile optimization** — Responsive refinement
- [ ] **Export to Excel/PDF** — Report export buttons
- [ ] **Email integration** — Send quotes, invoices

### Estimated Work

| Phase | Effort | Description |
|-------|--------|-------------|
| DB Integration | 2-3 weeks | Connect all pages to Supabase via Prisma |
| Auth + RBAC | 1 week | Proper NextAuth + role-based routes |
| CRUD Operations | 2-3 weeks | Server Actions for all 5 modules |
| Testing | 1-2 weeks | Unit + E2E tests |
| **Total MVP** | **6-9 weeks** | Fully functional ERP |

---

*Generated by Vibecode Kit v4.0 — XRAY Protocol*
