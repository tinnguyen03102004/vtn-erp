# SDD — VTN-ERP System Design Document

> Phase 1: Hoàn thiện CRUD | Next.js 16 + Supabase

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Browser (30 users)"]
        UI["Next.js App Router<br/>React Server Components"]
    end

    subgraph Server["Vercel / Node.js"]
        RSC["Server Components"]
        SA["Server Actions<br/>(src/lib/actions/)"]
        AUTH["NextAuth v5<br/>(JWT Strategy)"]
        API["API Routes<br/>(/api/auth/*)"]
    end

    subgraph Supabase["Supabase Cloud"]
        SB_API["Supabase JS Client<br/>(@supabase/supabase-js)"]
        PG["PostgreSQL<br/>(16 tables)"]
    end

    UI --> RSC
    RSC --> SA
    SA --> SB_API
    SB_API --> PG
    UI --> API
    API --> AUTH
    AUTH --> SB_API
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (Turbopack) | 16.1.6 |
| Auth | NextAuth.js | v5 |
| Database | Supabase PostgreSQL | — |
| Client | @supabase/supabase-js | ^2.x |
| Styling | Vanilla CSS | — |
| Language | TypeScript | 5.x |

---

## 3. Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ employees : "1:1"
    users ||--o{ crm_leads : "assigned"
    users ||--o{ sale_orders : "created"
    users ||--o{ projects : "manages"
    users ||--o{ timesheets : "logs"
    users ||--o{ project_tasks : "assigned"

    crm_stages ||--o{ crm_leads : "stage"
    crm_leads ||--o{ sale_orders : "converts"

    sale_orders ||--o{ sale_order_lines : "has lines"
    sale_orders ||--o{ sale_milestones : "has milestones"
    sale_orders ||--o{ projects : "generates"

    projects ||--o{ project_phases : "has phases"
    projects ||--o{ project_tasks : "has tasks"
    projects ||--o{ invoices : "has invoices"
    projects ||--o{ timesheets : "tracked"

    project_phases ||--o{ project_tasks : "contains"
    sale_milestones ||--o{ project_phases : "links"
    sale_milestones ||--o{ invoices : "generates"

    invoices ||--o{ payments : "receives"

    users {
        text id PK
        text email
        text password
        text name
        UserRole role "DIRECTOR|PM|ARCHITECT|FINANCE|SALES"
        boolean isActive
    }

    crm_leads {
        text id PK
        text name
        text partnerName
        text stageId FK
        numeric expectedValue
        float probability
        text assignedToId FK
    }

    sale_orders {
        text id PK
        text name
        text leadId FK
        text partnerName
        SaleOrderState state "DRAFT|SENT|SALE|DONE|CANCEL"
        numeric totalAmount
    }

    projects {
        text id PK
        text name
        text code
        text saleOrderId FK
        ProjectState state "DRAFT|ACTIVE|PAUSED|DONE|CANCELLED"
        numeric budget
        text managerId FK
    }

    invoices {
        text id PK
        text name
        InvoiceState state "DRAFT|POSTED|PAID|CANCELLED"
        numeric amountTotal
        text projectId FK
        text milestoneId FK
    }

    payments {
        text id PK
        text invoiceId FK
        numeric amount
        timestamp paymentDate
    }
```

---

## 4. Module Map

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/        ← KPIs + recent items
│   │   ├── crm/              ← Kanban + [id] detail
│   │   ├── sale/             ← List + [id] detail + /new form
│   │   ├── projects/         ← List + [id] detail
│   │   ├── employees/        ← Grid view
│   │   ├── finance/invoices/ ← Invoice list
│   │   ├── timesheets/       ← Weekly view
│   │   ├── reports/          ← Charts
│   │   └── settings/         ← Company settings
│   ├── api/auth/             ← signin route
│   └── login/                ← Login page
├── lib/
│   ├── auth.ts               ← NextAuth config (Supabase)
│   ├── supabase.ts           ← Supabase client
│   ├── utils.ts              ← formatCurrency, formatDate
│   └── actions/
│       ├── crm.ts            ← getLeads, getLead
│       ├── sale.ts           ← getOrders, getOrder, createOrder
│       ├── projects.ts       ← getProjects, getProject
│       ├── employees.ts      ← getEmployees
│       ├── finance.ts        ← getInvoices
│       ├── timesheets.ts     ← getTimesheets
│       └── dashboard.ts      ← getDashboardKPIs
```

---

## 5. Server Actions — CRUD Gap Analysis

| Module | Read | Create | Update | Delete |
|---|---|---|---|---|
| CRM Leads | ✅ | ❌ | ❌ | ❌ |
| CRM Stages | ✅ | — | ❌ move | — |
| Sale Orders | ✅ | ✅ | ❌ | ❌ |
| Sale Lines | ✅ | — | ❌ | ❌ |
| Sale Milestones | ✅ | ✅ | ❌ | ❌ |
| Projects | ✅ | ❌ | ❌ | ❌ |
| Project Phases | ✅ | ❌ | ❌ | ❌ |
| Project Tasks | — | ❌ | ❌ | ❌ |
| Invoices | ✅ | ❌ | ❌ | ❌ |
| Payments | — | ❌ | — | — |
| Employees | ✅ | ❌ | ❌ | ❌ |
| Timesheets | ✅ | ❌ | ❌ | ❌ |
| Settings | — | — | ❌ | — |

> **72 actions cần thêm** (Create + Update + Delete cho mỗi entity)

---

## 6. Enums Reference

| Enum | Values |
|---|---|
| UserRole | DIRECTOR, PROJECT_MANAGER, ARCHITECT, FINANCE, SALES |
| SaleOrderState | DRAFT, SENT, SALE, DONE, CANCEL |
| ProjectState | DRAFT, ACTIVE, PAUSED, DONE, CANCELLED |
| PhaseState | TODO, IN_PROGRESS, DONE |
| TaskState | TODO, IN_PROGRESS, REVIEW, DONE |
| Priority | LOW, NORMAL, HIGH, URGENT |
| InvoiceState | DRAFT, POSTED, PAID, CANCELLED |
| InvoiceType | OUT_INVOICE, OUT_REFUND |
| MilestoneState | PENDING, INVOICED, PAID |
