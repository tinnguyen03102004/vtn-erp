# VTN ERP Review Backlog

Reviewed on `2026-03-13` against the current `HEAD` baseline, with `WIP` isolated to:

- `src/app/api/ai/chat/route.ts`
- `src/components/chat/ChatPanel.tsx`
- `src/components/chat/chatConstants.ts`

## Automated Baseline

| Command | Exit | Result |
|---|---:|---|
| `npm run lint` | `1` | Real repo issues. Two hard errors: `e2e/fixtures.ts` hook-name lint false positive and `src/lib/__tests__/actions/dashboard.test.ts` uses `Function`; 15 warnings remain. |
| `npm test` | `1` | Blocked by environment: `spawn EPERM` while Vite/Vitest tries to start `esbuild`. No pass signal available. |
| `npm run build` | `1` | Real repo issue plus environment issue. Turbopack reports missing modules `pdf-parse` and `mammoth` from `src/app/api/ai/chat/route.ts`, then exits with `spawn EPERM`. |
| `npm run test:e2e` | `1` | Blocked by environment: `spawn EPERM` when Playwright tries to start the web server. |

## MCP Playwright Validation

Used MCP Playwright against the already-running local app on `http://localhost:3000`.

| Flow | Result | Notes |
|---|---|---|
| Director login via UI → `/dashboard` | `Pass` | Login succeeded and the dashboard rendered after the loading shell. |
| Architect login → `/projects` | `Pass` | Project list rendered correctly for `ARCHITECT`, confirming session/auth flow worked in browser. |
| Architect login → `/settings` | `Fail as expected` | Route shows `Forbidden — Bạn không có quyền "settings.view"`. |
| Architect login → `/finance/invoices` | `Fail as expected` | Route shows `Forbidden — Bạn không có quyền "finance.view"`. |
| Sidebar visibility for `ARCHITECT` | `Fail` | Forbidden links like `Cài đặt` and `Hóa đơn` are still rendered in the sidebar even though the destination is denied. |

## Baseline Findings

### F-001

- `ID`: `F-001`
- `Severity`: `P0`
- `Subsystem`: `auth`, `middleware`, `server-rendered read paths`
- `Risk`: A predictable session secret plus signature-only middleware allows requests to reach server-rendered pages and routes that never validate a real DB-backed session. That turns missing `AUTH_SECRET` into a data exposure issue, not just a config smell.
- `Evidence`:
  - `src/lib/session.ts:17` falls back to `'vtn-erp-default-secret'`.
  - `src/proxy.ts:17-24` only checks `verifySignature(cookieValue)` and never looks up `app_sessions`.
  - `src/app/(dashboard)/crm/[id]/page.tsx:7-12`, `src/app/(dashboard)/projects/[id]/page.tsx:7-13`, and `src/app/(dashboard)/finance/invoices/[id]/page.tsx:7-12` fetch protected data without calling `requireAuth()` or `requirePermission()`.
  - The underlying read actions `getLead`, `getProject`, and `getInvoice` also skip auth checks in `src/lib/actions/crm.ts:29-31`, `src/lib/actions/projects.ts:25-45`, and `src/lib/actions/finance.ts:23-37`.
- `Affected files/routes`: `src/lib/session.ts`, `src/proxy.ts`, `/crm/[id]`, `/projects/[id]`, `/finance/invoices/[id]`
- `How to verify/reproduce`: remove `AUTH_SECRET` or leave it at the default, forge a correctly signed cookie for any token, then request a detail page or route that only depends on middleware signature checks.
- `Recommended fix`: fail fast when `AUTH_SECRET` is absent, require a DB-backed session check on every protected server page/API route, and treat middleware as a coarse prefilter rather than the primary auth boundary.
- `Suggested owner`: backend/auth
- `Depends on WIP?`: `No`

### F-002

- `ID`: `F-002`
- `Severity`: `P1`
- `Subsystem`: `RBAC`, `admin/settings`, `cross-role data access`
- `Risk`: The permission matrix exists, but read-path enforcement is missing in the places that matter. Any authenticated user can reach routes and server actions that should be role-gated, including settings and user management surfaces.
- `Evidence`:
  - `src/components/shared/Sidebar.tsx:7-125` defines `roles` on nav items but never filters by the current user.
  - `src/app/(dashboard)/settings/page.tsx:7-13` loads `getSettings()` and `getUsers()` without any permission check.
  - `src/lib/actions/users.ts:10-12` returns all users without `requirePermission('users.manage')`.
  - `src/lib/actions/settings.ts:9-16`, `src/lib/actions/employees.ts:9-27`, `src/lib/actions/finance.ts:9-37`, and `src/lib/actions/sale.ts:11-71` expose module reads with no role gate.
  - `README.md:734-738` already notes that RBAC is only partially enforced; the code still matches that warning.
- `Affected files/routes`: `src/components/shared/Sidebar.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/lib/actions/users.ts`, `src/lib/actions/settings.ts`, `src/lib/actions/employees.ts`, `src/lib/actions/finance.ts`, `src/lib/actions/sale.ts`
- `How to verify/reproduce`: sign in as a low-privilege role such as `ARCHITECT` or `SALES`, then navigate directly to `/settings`, `/employees`, or `/finance/invoices`.
- `Recommended fix`: enforce `requirePermission(...)` or `requireModuleAccess(...)` on every server-side read action and page entrypoint; treat sidebar filtering as UX only.
- `Suggested owner`: backend/auth + frontend shell
- `Depends on WIP?`: `No`

### F-003

- `ID`: `F-003`
- `Severity`: `P0`
- `Subsystem`: `employees`, `auth`
- `Risk`: Employee creation stores the password as provided, while login expects a bcrypt hash. That is both a credential storage issue and a broken login path for newly created employees.
- `Evidence`:
  - `src/lib/actions/employees.ts:35-41` inserts `password: parsed.data.password || null`.
  - `src/app/api/auth/signin/route.ts:30-33` authenticates with `bcrypt.compare(password, user.password)`.
  - `src/lib/actions/users.ts:18-25` already hashes passwords correctly, so the inconsistency is local to the employee flow.
- `Affected files/routes`: `src/lib/actions/employees.ts`, `/api/auth/signin`
- `How to verify/reproduce`: create an employee with a password, inspect the stored row, then attempt login through `/api/auth/signin`.
- `Recommended fix`: hash employee passwords exactly like `createUser`, and add a regression test that creates a user/employee pair and authenticates with the stored password.
- `Suggested owner`: backend/auth
- `Depends on WIP?`: `No`

### F-004

- `ID`: `F-004`
- `Severity`: `P1`
- `Subsystem`: `CRM`
- `Risk`: The lead creation path does not match the current database contract. The Zod schema strips or rejects fields that the DB requires, so the primary “create lead” flow is not aligned with runtime data.
- `Evidence`:
  - `src/lib/actions/crm.ts:34-40` inserts `parsed.data` directly into `crm_leads`.
  - `src/lib/schemas.ts:7-18` defines `createLeadSchema` with `contactName`, `expectedRevenue`, and `stageId` as `uuid`, but not `partnerName`, `expectedValue`, or `probability`.
  - `src/lib/database.types.ts:212-225` shows `crm_leads.Insert` requires `name`, `partnerName`, and `stageId`; `expectedValue` is the actual column name.
  - `src/components/CRMKanban.tsx:73-89` passes `partnerName`, `expectedValue`, `stageId`, and `probability`, but those fields are not preserved by the schema.
- `Affected files/routes`: `src/lib/actions/crm.ts`, `src/lib/schemas.ts`, `src/components/CRMKanban.tsx`
- `How to verify/reproduce`: open the “Tạo Lead” modal and submit a valid-looking form; watch the action payload after Zod parsing versus the insert contract.
- `Recommended fix`: align the schema to the actual table contract, remove the stale field names, and add one integration-style test that asserts the insert payload shape.
- `Suggested owner`: backend/CRM
- `Depends on WIP?`: `No`

### F-005

- `ID`: `F-005`
- `Severity`: `P1`
- `Subsystem`: `sale`, `projects`, `finance`
- `Risk`: Several core write paths rely on `parseInput(...); insert(parsed.data)` even though the schema omits DB-required fields. This makes multiple “happy path” create flows structurally unreliable.
- `Evidence`:
  - `src/lib/actions/sale.ts:74-85` creates an order without setting `name`, while `src/lib/database.types.ts:720-737` requires `sale_orders.Insert.name`.
  - `src/app/(dashboard)/sale/new/page.tsx:52-59` depends on `createOrder` succeeding before milestones are created.
  - `src/lib/actions/projects.ts:93-100` creates a task from `createTaskSchema`, but `src/lib/schemas.ts:89-94` omits `projectId` and `src/lib/database.types.ts:503-515` requires it.
  - `src/components/ProjectDetail.tsx:82-89` passes `projectId`, but the schema strips it before insert.
  - `src/lib/actions/finance.ts:69-76` inserts `parsed.data` for payments, yet `src/lib/schemas.ts:52-58` omits required `paymentDate` and uses `notes/reference`, while `src/lib/database.types.ts:409-417` requires `paymentDate` and the UI sends `note`.
- `Affected files/routes`: `src/lib/actions/sale.ts`, `src/app/(dashboard)/sale/new/page.tsx`, `src/lib/actions/projects.ts`, `src/components/ProjectDetail.tsx`, `src/lib/actions/finance.ts`, `src/lib/schemas.ts`
- `How to verify/reproduce`: run the create quotation, create project task, and record payment flows against a real database or log the parsed payloads before insert.
- `Recommended fix`: define explicit per-action insert payload builders instead of inserting raw parsed objects, then backfill tests that assert required DB fields are present.
- `Suggested owner`: backend/domain modules
- `Depends on WIP?`: `No`

### F-006

- `ID`: `F-006`
- `Severity`: `P1`
- `Subsystem`: `timesheets`
- `Risk`: The weekly timesheet save path trusts the caller-provided `employeeId`, deletes existing entries for that employee, and inserts rows without the `userId` required by the current table contract. A logged-in user can target another employee’s rows, and the insert shape itself is incomplete.
- `Evidence`:
  - `src/lib/actions/timesheets.ts:28-56` only calls `requireAuth()`, then deletes by `employeeId` supplied by the caller and inserts rows without `userId`.
  - `src/lib/database.types.ts:848-858` shows `timesheets.Insert` requires `userId`.
  - `src/app/(dashboard)/timesheets/page.tsx:49-61` computes a current employee ID for the UI, but the action itself does not enforce that relationship.
- `Affected files/routes`: `src/lib/actions/timesheets.ts`, `src/app/(dashboard)/timesheets/page.tsx`
- `How to verify/reproduce`: invoke `saveWeekTimesheets` with another employee’s ID from a logged-in session or inspect the generated insert rows.
- `Recommended fix`: derive `employeeId` and `userId` on the server from the authenticated session, reject cross-user writes, and wrap delete+insert in a transaction-equivalent strategy.
- `Suggested owner`: backend/timesheets
- `Depends on WIP?`: `No`

### F-007

- `ID`: `F-007`
- `Severity`: `P1`
- `Subsystem`: `frontend action handling`
- `Risk`: Several client components consume `ActionResult<T>` as if it were raw `T`, or ignore failure states entirely. That causes false success toasts, corrupt local state, and hides backend validation failures.
- `Evidence`:
  - `src/components/UserManagement.tsx:35-41` stores `updateUser(...)` / `createUser(...)` results directly into state instead of checking `result.success` and using `result.data`.
  - `src/components/EmployeesGrid.tsx:43-49` appends `createEmployee(...)` directly to `employees`, again assuming the return is the entity rather than `ActionResult`.
  - `src/components/ProjectDetail.tsx:45-48`, `src/components/ProjectDetail.tsx:57-58`, and `src/components/ProjectDetail.tsx:87-88` merge action results into local state without unwrapping `data`.
  - `src/components/SettingsContent.tsx:27-31` shows success after `saveSettings(...)` regardless of `result.success`, because failures are returned, not thrown.
- `Affected files/routes`: `src/components/UserManagement.tsx`, `src/components/EmployeesGrid.tsx`, `src/components/ProjectDetail.tsx`, `src/components/SettingsContent.tsx`
- `How to verify/reproduce`: trigger a validation failure or DB failure in one of these forms and observe that local state and toast behavior diverge from the actual backend result.
- `Recommended fix`: standardize a client-side helper for `ActionResult` handling and make the TypeScript surface reject raw assignment of `ActionResult<T>` to entity state.
- `Suggested owner`: frontend/platform
- `Depends on WIP?`: `No`

### F-008

- `ID`: `F-008`
- `Severity`: `P2`
- `Subsystem`: `upload`, `attachments`
- `Risk`: The route used by the UI bypasses the stricter validation policy already present in the server action. It accepts arbitrary `entityType/entityId` pairs and any MIME type below 10 MB, then exposes files through a public storage URL pattern.
- `Evidence`:
  - `src/app/api/upload/route.ts:12-55` only checks presence and size.
  - `src/lib/actions/attachments.ts:8-18` defines allowed types and limits, but `AttachmentPanel` does not use that action for uploads.
  - `src/components/AttachmentPanel.tsx:61-69` posts directly to `/api/upload`.
  - `src/components/AttachmentPanel.tsx:24-27` builds a public storage URL from `NEXT_PUBLIC_SUPABASE_URL`.
- `Affected files/routes`: `/api/upload`, `src/lib/actions/attachments.ts`, `src/components/AttachmentPanel.tsx`
- `How to verify/reproduce`: upload an allowed-size file with a non-approved MIME type or target an unrelated `entityType/entityId` pair from the browser console.
- `Recommended fix`: move the UI to the validated upload action or replicate its checks in the API route, and enforce entity-level authorization before upload and readback.
- `Suggested owner`: backend/storage
- `Depends on WIP?`: `No`

### F-009

- `ID`: `F-009`
- `Severity`: `P2`
- `Subsystem`: `tests`
- `Risk`: The current unit suite mainly proves mocked call chains and schema parsing, not the real runtime contracts. Several tests encode the same incorrect assumptions that exist in production code.
- `Evidence`:
  - `src/lib/__tests__/actions/sale.test.ts:60-71` expects `createOrder({ partnerName })` to succeed even though the current DB contract requires `name`.
  - `src/lib/__tests__/actions/projects.test.ts:90-97` expects `createTask({ name, phaseId })` to succeed even though `projectId` is required by runtime types.
  - `src/lib/__tests__/actions/finance.test.ts:95-111` treats `createPayment({ invoiceId, amount })` as sufficient, matching the broken action contract rather than the DB contract.
  - E2E coverage in `e2e/*.spec.ts` focuses on page render/navigation and does not assert role boundaries, settings access, or timesheet ownership.
- `Affected files/routes`: `src/lib/__tests__/actions/*.test.ts`, `e2e/*.spec.ts`
- `How to verify/reproduce`: compare test input shapes with `src/lib/database.types.ts` insert contracts and with the corresponding UI flows.
- `Recommended fix`: add contract-aware tests around action payload building, role enforcement, and one end-to-end flow per critical module.
- `Suggested owner`: QA + backend
- `Depends on WIP?`: `No`

## WIP Findings

### WIP-001

- `ID`: `WIP-001`
- `Severity`: `P1`
- `Subsystem`: `AI chat`, `file attachments`
- `Risk`: The attachment feature in the current working tree introduces a hard build blocker because it imports packages that are not declared in the project dependencies.
- `Evidence`:
  - `npm run build` reports `Can't resolve 'pdf-parse'` and `Can't resolve 'mammoth'`.
  - The imports come from `src/app/api/ai/chat/route.ts:9` and `src/app/api/ai/chat/route.ts:20`.
  - `package.json` does not list either package.
- `Affected files/routes`: `src/app/api/ai/chat/route.ts`, `package.json`
- `How to verify/reproduce`: run `npm run build` on the current working tree.
- `Recommended fix`: either add and pin the dependencies or gate the feature behind an installed-capability check before merging the WIP.
- `Suggested owner`: AI/chat WIP owner
- `Depends on WIP?`: `Yes`

## Module Health

| Module | Status | Notes |
|---|---|---|
| Auth/session | `has concrete finding` | Secret fallback + signature-only middleware create a weak trust boundary. |
| RBAC/navigation | `has concrete finding` | Roles are modeled but not enforced on server reads or sidebar rendering. |
| CRM | `has concrete finding` | Lead creation contract is out of sync with the current data model. |
| Sale | `has concrete finding` | Create quotation/order path does not satisfy current insert contract. |
| Projects | `has concrete finding` | Task creation strips `projectId` before insert. |
| Finance | `has concrete finding` | Payment creation contract diverges from DB-required fields. |
| Employees | `has concrete finding` | Employee creation mishandles passwords. |
| Timesheets | `has concrete finding` | Ownership checks and insert payload are incomplete. |
| Settings/admin | `has concrete finding` | Sensitive reads are exposed cross-role. |
| Upload/PDF | `needs follow-up` | Upload route bypasses validation; PDF/read-path exposure depends on auth fixes. |
| AI chat WIP | `has concrete finding` | Current working tree does not build. |

## Critical Flow Coverage Matrix

| Flow | Unit | E2E | Manual/Code Review | Assessment |
|---|---|---|---|---|
| Login, invalid login, redirect to `/login` | Partial | Covered in `e2e/auth.spec.ts` | Reviewed | `covered`, but no test for secret fallback or DB-backed session verification |
| CRM create lead + stage move | Partial | Dialog open only | Reviewed | `missing` for real create success against runtime contract |
| Create quotation/order | Misleading | Attempted in `e2e/sale.spec.ts` | Reviewed | `missing` for DB contract and line/milestone persistence |
| Create project task | Misleading | None | Reviewed | `missing` |
| Record payment and mark invoice paid | Misleading | None | Reviewed | `missing` |
| Save weekly timesheet for current user only | None | None | Reviewed | `missing` |
| Settings/user management role gate | None | None | Reviewed | `missing` |
| Upload attachment authorization and MIME validation | None | None | Reviewed | `missing` |

## Recommended Batches

### Stabilize now

- `F-001` Replace default session secret behavior and add real auth enforcement on server reads.
- `F-003` Hash employee passwords and backfill login regression coverage.
- `F-004` and `F-005` Align action schemas with current DB insert contracts before more domain work lands.
- `WIP-001` Resolve missing AI attachment dependencies before merging the current WIP.

### Risk reduction

- `F-002` Lock down cross-role reads on settings, users, finance, employees, and project/sale detail pages.
- `F-006` Bind timesheet writes to the authenticated user server-side.
- `F-008` Unify upload validation and authorization between route and server action.

### Hygiene

- `F-007` Normalize `ActionResult` handling across client components.
- `F-009` Replace mock-only success tests with contract-aware tests and role-boundary coverage.
