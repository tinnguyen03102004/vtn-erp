# Database Schema Documentation

## Overview

VTN ERP sử dụng PostgreSQL 17.6 hosted trên Supabase (ap-southeast-1).

- **22 tables** với Row Level Security (RLS) enabled
- **Primary key type**: `text` (UUID-like strings)
- **Naming convention**: `snake_case` cho tables, `camelCase` cho columns

## Tables

### Core Tables

| Table | Description | Key Relations |
|-------|------------|---------------|
| `users` | User accounts (login) | → `employees`, `app_sessions` |
| `employees` | Employee profiles | ← `users.id` |
| `app_sessions` | Server-side auth sessions | ← `users.id` |
| `settings` | Company settings (key-value) | — |
| `audit_logs` | Audit trail | ← `users.id` |
| `attachments` | File upload metadata | — |

### CRM Tables

| Table | Description | Key Columns |
|-------|------------|-------------|
| `crm_stages` | Pipeline stages | `name`, `sequence`, `probability` |
| `crm_leads` | Leads/opportunities | `stageId` → `crm_stages`, `assignedToId` → `users` |

### Sales Tables

| Table | Description | Key Columns |
|-------|------------|-------------|
| `sale_orders` | Quotations & contracts | `leadId` → `crm_leads`, `state` (DRAFT/SENT/SALE/DONE/CANCEL) |
| `sale_order_lines` | Service line items | `orderId` → `sale_orders` |
| `sale_milestones` | Payment milestones | `orderId` → `sale_orders` |

### Project Tables

| Table | Description | Key Columns |
|-------|------------|-------------|
| `projects` | Projects | `saleOrderId` → `sale_orders`, `managerId` → `users` |
| `project_phases` | Project phases | `projectId` → `projects`, `milestoneId` → `sale_milestones` |
| `project_tasks` | Tasks | `projectId` → `projects`, `phaseId` → `project_phases` |

### Finance Tables

| Table | Description | Key Columns |
|-------|------------|-------------|
| `invoices` | Invoices | `projectId` → `projects`, `milestoneId` → `sale_milestones` |
| `payments` | Payment records | `invoiceId` → `invoices` |

### HR/Payroll Tables

| Table | Description | Key Columns |
|-------|------------|-------------|
| `timesheets` | Hour logs | `userId` → `users`, `projectId` → `projects` |
| `payroll_periods` | Pay periods | `month`, `year`, `state` |
| `payroll_slips` | Individual pay slips | `periodId` → `payroll_periods`, `employeeId` → `employees` |

## Entity Relationships

```
users ──1:1──→ employees
users ──1:N──→ app_sessions
users ──1:N──→ crm_leads (assigned)
users ──1:N──→ timesheets

crm_stages ──1:N──→ crm_leads
crm_leads  ──1:N──→ sale_orders

sale_orders ──1:N──→ sale_order_lines
sale_orders ──1:N──→ sale_milestones
sale_orders ──1:1──→ projects

sale_milestones ──1:1──→ project_phases
sale_milestones ──1:1──→ invoices

projects ──1:N──→ project_phases
projects ──1:N──→ project_tasks
projects ──1:N──→ timesheets
projects ──1:N──→ invoices

invoices ──1:N──→ payments

payroll_periods ──1:N──→ payroll_slips
employees ──1:N──→ payroll_slips
```

## Migrations

Migrations are managed via Supabase Dashboard and tracked in `CHANGELOG.md`.

| Date | Migration | Description |
|------|-----------|-------------|
| 2026-03 | Initial schema | Core 18 tables |
| 2026-05 | `create_payroll_tables` | `payroll_periods`, `payroll_slips` |
| 2026-05 | `add_employee_salary_fields` | Salary, allowance, insurance columns |
