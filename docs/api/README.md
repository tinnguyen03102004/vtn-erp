# API Documentation

## Overview

VTN ERP exposes functionality through **Server Actions** (primary) and **API Routes** (file downloads, webhooks).

All server actions are in `src/lib/actions/` and follow the `ActionResult<T>` pattern:
- `{ success: true, data: T }` on success
- `{ success: false, error: string, fieldErrors?: Record<string, string> }` on failure

## Authentication

All endpoints require authentication via HMAC-signed session cookie.
- Cookie name: `vtn-session`
- Format: `sessionId:hmac-signature`
- Server validates signature → looks up `app_sessions` table → returns user

### RBAC Permissions

| Role | Permissions |
|------|------------|
| ADMIN / DIRECTOR | All permissions |
| PROJECT_MANAGER | CRM, Sales, Projects, HR (view), Settings (view) |
| ARCHITECT | Projects (view), HR (view) |
| FINANCE | Sales (view), Finance (full), HR (view), Settings (view) |
| SALES | CRM (full), Sales (full), HR (view) |

## Server Actions

### CRM Module (`src/lib/actions/crm.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getStages()` | `crm.view` | List all pipeline stages |
| `getLeads()` | `crm.view` | List all leads |
| `getLead(id)` | `crm.view` | Get single lead detail |
| `createLead(data)` | `crm.edit` | Create new lead |
| `updateLead(id, data)` | `crm.edit` | Update lead fields |

### Sales Module (`src/lib/actions/sale.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getSaleOrders()` | `sale.view` | List all orders |
| `getSaleOrder(id)` | `sale.view` | Get order with lines + milestones |
| `createSaleOrder(data)` | `sale.edit` | Create quotation |
| `updateSaleOrder(id, data)` | `sale.edit` | Update order |
| `confirmSaleOrder(id)` | `sale.approve` | Confirm → Contract |
| `addOrderLine(orderId, data)` | `sale.edit` | Add service line |
| `addMilestone(orderId, data)` | `sale.edit` | Add payment milestone |

### Projects Module (`src/lib/actions/projects.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getProjects()` | `project.view` | List all projects |
| `getProject(id)` | `project.view` | Get project with phases + tasks |
| `createProject(data)` | `project.edit` | Create project |
| `updateProject(id, data)` | `project.edit` | Update project |
| `addPhase(projectId, data)` | `project.edit` | Add phase |
| `addTask(projectId, data)` | `project.edit` | Add task |
| `updateTaskState(id, state)` | `project.edit` | Move task state |

### Finance Module (`src/lib/actions/finance.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getInvoices()` | `finance.view` | List all invoices |
| `getInvoice(id)` | `finance.view` | Get invoice with payments |
| `createInvoice(data)` | `finance.edit` | Create invoice |
| `postInvoice(id)` | `finance.edit` | Post (send) invoice |
| `recordPayment(data)` | `finance.edit` | Record payment |

### HR Module (`src/lib/actions/employees.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getEmployees()` | `hr.view` | List with user + hours |
| `getEmployee(id)` | `hr.view` | Get single employee |
| `getCurrentEmployee()` | Auth only | Get current user's employee record |
| `createEmployee(data)` | `hr.edit` | Create user + employee |
| `updateEmployee(id, data)` | `hr.edit` | Update employee |

### Payroll Module (`src/lib/actions/payroll.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getPayrollPeriods()` | `finance.view` | List all pay periods |
| `getPayrollPeriod(id)` | `finance.view` | Get period + slips |
| `createPayrollPeriod(data)` | `finance.edit` | Create pay period |
| `generatePayrollSlips(id)` | `finance.edit` | Calculate salaries (BHXH, PIT) |
| `confirmPayroll(id)` | `finance.edit` | Confirm payroll |
| `markPayrollPaid(id, ref?)` | `finance.edit` | Mark as paid |
| `updateEmployeeSalary(id, data)` | `finance.edit` | Set salary fields |

### Attendance Module (`src/lib/actions/attendance.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getAttendancePeriods()` | `hr.view` | List attendance periods |
| `getAttendancePeriod(id)` | `hr.view` | Get period with employee summaries |
| `importAttendance(parsed)` | `hr.edit` | Import from Excel parser |
| `getMyAttendance(periodId?)` | Auth only | Employee self-view |
| `addMissingAttendance(...)` | Auth only | Employee add missing record |
| `reviewAttendanceRecord(id, action)` | `hr.edit` | Approve/reject |
| `updatePeriodState(id, state)` | `hr.edit` | Lock/unlock period |

### Timesheets (`src/lib/actions/timesheets.ts`)

| Function | Permission | Description |
|----------|-----------|-------------|
| `getTimesheets(filters?)` | Auth only | Get own timesheets |
| `saveWeekTimesheets(empId, entries)` | Auth only | Bulk save week |
| `createTimesheet(data)` | Auth only | Create single entry |
| `updateTimesheet(id, data)` | Auth only | Update own entry |
| `deleteTimesheet(id)` | Auth only | Delete own entry |

### Other Actions

| Action | File | Permission | Description |
|--------|------|-----------|-------------|
| `globalSearch(query)` | `search.ts` | None | Search across all modules |
| `getSettings()` | `settings.ts` | `settings.view` | Get company settings |
| `saveSettings(data)` | `settings.ts` | `settings.edit` | Save settings |
| `getUsers()` | `users.ts` | `users.manage` | List users |
| `createUser(data)` | `users.ts` | `users.manage` | Create user |
| `getAttachments(type, id)` | `attachments.ts` | Varies | Get file list |
| `uploadAttachment(input)` | `attachments.ts` | Varies | Upload file (10MB max) |
| `deleteAttachment(id)` | `attachments.ts` | Varies | Delete file |
| `generateInvoicePDF(id)` | `invoice-pdf.ts` | None | Generate invoice HTML |

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/signin` | POST | No | Login (email + password) |
| `/api/auth/signout` | POST | Yes | Logout (delete session) |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/ai/chat` | POST | Yes | AI chat with tool calling |
| `/api/payroll/pdf/[periodId]` | GET | Yes | Download payroll PDF |
| `/api/pdf/[id]` | GET | Yes | Download invoice PDF |
| `/api/reports/export` | GET | DIRECTOR | Download CSV report |
| `/api/upload` | POST | Yes | File upload endpoint |
| `/api/attendance/import` | POST | `hr.edit` | Excel attendance import |
