# Reports Module Test Plan

## Scope
- In scope:
  - Authenticated Director can open `/reports`.
  - KPI cards, utilization/project/lead/invoice/payroll report sections render without blank states or crashes.
  - Sidebar navigation to Reports works.
  - Director can export a CSV report from `/api/reports/export`.
  - Unauthenticated export requests are rejected.
- Out of scope:
  - Pixel-perfect chart styling.
  - Exact KPI values, because report data is demo database state.

## Environment
- Seed: `e2e/fixtures.ts` authenticated Director session.
- Base URL: `http://localhost:3000`.
- Required data: existing demo project, invoice, employee, CRM, and payroll records.
- Cleanup: no new database records are created.

## Scenarios
### 1. Director views reports dashboard
**Seed:** `e2e/fixtures.ts`
**Preconditions:** User is authenticated as Director.
**Steps:**
1. Open `/reports`.
2. Verify the page heading and export action.
3. Verify the four KPI cards render.
4. Verify the utilization, project progress, lead source, invoice summary, and payroll sections render when data exists.
**Expected Results:**
- Page does not redirect to login.
- Main report sections and data cards are visible.
- Numeric or currency values are present in KPI cards.

### 2. Sidebar navigation reaches Reports
**Seed:** `e2e/fixtures.ts`
**Preconditions:** User is authenticated as Director.
**Steps:**
1. Open `/dashboard`.
2. Click the Reports sidebar link.
**Expected Results:**
- Browser navigates to `/reports`.
- Reports page heading is visible.

### 3. Director exports CSV
**Seed:** `e2e/fixtures.ts`
**Preconditions:** User is authenticated as Director.
**Steps:**
1. Open `/reports`.
2. Click export.
3. Read the downloaded file.
**Expected Results:**
- Download filename starts with `VTN-ERP-Report-`.
- CSV includes the summary title and expected sections for projects, invoices, payments, employees, and totals.

### 4. Unauthenticated export is rejected
**Seed:** none.
**Preconditions:** Browser has no storage state.
**Steps:**
1. Request `/api/reports/export`.
**Expected Results:**
- API responds with HTTP 401 and JSON error.
