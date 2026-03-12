# 🚀 UPGRADE GUIDE: VTN Architecture ERP

> Generated: 2026-03-10
> Current Stack: Next.js 16.1.6 / React 19.2.3 / Prisma 7.4.2 / TailwindCSS v4

---

## Current Health Summary

| Metric | Status |
|--------|--------|
| ESLint Errors | ✅ 0 |
| ESLint Warnings | ⚠️ 28 (unused vars) |
| npm Audit | ✅ 0 vulnerabilities |
| Build | ✅ Passes |
| `eslint-disable` count | ⚠️ 50+ |
| Test coverage | ⚠️ Low (6 unit + 3 E2E) |

---

## Upgrade Roadmap

### Phase 1: Quick Wins (1-2 hours)

#### 1.1 Update Outdated Packages

```bash
npm update @supabase/supabase-js recharts
```

No breaking changes expected (minor/patch versions).

#### 1.2 Fix 28 ESLint Warnings

All warnings are `@typescript-eslint/no-unused-vars`. Fix by:

- Removing unused imports/variables
- Prefixing intentional unused params with `_`

```bash
npx eslint src --fix  # Auto-fix where possible
```

---

### Phase 2: Type Safety (4-6 hours)

#### 2.1 Reduce `eslint-disable` Comments

Target files (by number of disables):

| File | Disables | Strategy |
|------|----------|----------|
| `SaleDetail.tsx` | 12 | Define `SaleOrderWithRelations` type using Prisma payload types |
| `sale.ts` | 7 | Type Prisma query results with `Prisma.SaleOrderGetPayload<{include: ...}>` |
| `ChatPanel.tsx` | 3 | Type AI tool results properly |
| `projects.ts` | 3 | Same Prisma payload strategy |
| `finance.ts` | 3 | Same strategy |
| `employees.ts` | 3 | Same strategy |
| `UserManagement.tsx` | 3 | Type user data from server |
| `AttachmentPanel.tsx` | 2 | Type upload/delete callbacks |

**File-level disables to eliminate:**

| File | Action |
|------|--------|
| `LeadDetail.tsx` | Define `LeadWithStage` type, remove file-level disable |
| `InvoiceDetail.tsx` | Define `InvoiceWithPayments` type, remove file-level disable |
| `SaleOrderPDF.tsx` | Define PDF data prop types, remove file-level disable |
| `invoice-pdf.ts` | Type the PDF data transformation, remove file-level disable |

#### 2.2 Create Shared Type Definitions

Add to `src/lib/types.ts`:

```typescript
import { Prisma } from '@prisma/client'

// Prisma query result types
export type SaleOrderWithRelations = Prisma.SaleOrderGetPayload<{
  include: { lines: true; milestones: true; lead: true; createdBy: true; projects: true }
}>

export type LeadWithStage = Prisma.CrmLeadGetPayload<{
  include: { stage: true; assignedTo: true }
}>

export type InvoiceWithPayments = Prisma.InvoiceGetPayload<{
  include: { payments: true; project: true; milestone: true }
}>

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: { phases: { include: { tasks: true } }; manager: true; saleOrder: true }
}>
```

---

### Phase 3: Component Decomposition (6-8 hours)

#### 3.1 Split Large Components

**`SaleDetail.tsx` (29KB → 4 files):**

```
src/components/sale/
├── SaleDetail.tsx          # Main container (~100 lines)
├── SaleOrderForm.tsx       # Form fields
├── SaleOrderLines.tsx      # Line items table with add/edit/delete
├── SaleMilestones.tsx      # Milestone management
└── SaleStateActions.tsx    # State machine buttons (send, approve, sign, etc.)
```

**`ChatPanel.tsx` (24KB → 3 files):**

```
src/components/chat/
├── ChatPanel.tsx           # Main container + input
├── ChatMessages.tsx        # Message list rendering
└── ToolResultRenderer.tsx  # Tool result cards (table, metric, confirmation)
```

#### 3.2 Extract Shared Patterns

- Create `src/components/ui/DataTable.tsx` — reusable table component
- Create `src/components/ui/StatusBadge.tsx` — state badge with color mapping
- Create `src/components/ui/ConfirmDialog.tsx` — confirmation modal

---

### Phase 4: Test Coverage (8-12 hours)

#### 4.1 Server Action Tests (Priority)

Create tests for critical business logic:

```
src/lib/__tests__/
├── actions/
│   ├── sale.test.ts         # Quotation → Contract → Project workflow
│   ├── crm.test.ts          # Lead lifecycle, stage transitions
│   ├── projects.test.ts     # Project + phase + task CRUD
│   ├── finance.test.ts      # Invoice generation, payment recording
│   └── dashboard.test.ts    # KPI calculations
```

#### 4.2 E2E Tests (Expansion)

```
e2e/
├── auth.spec.ts             # ✅ Exists
├── navigation.spec.ts       # ✅ Exists
├── crm.spec.ts              # ✅ Exists
├── sale-workflow.spec.ts    # NEW: Full sales workflow
├── project-management.spec.ts # NEW: Project phases & tasks
└── finance.spec.ts          # NEW: Invoice & payments
```

---

### Phase 5: Architecture Improvements (Future)

#### 5.1 Error Boundaries

Add `error.tsx` and `loading.tsx` for each route group:

```
src/app/(dashboard)/
├── error.tsx                # Dashboard-level error boundary
├── loading.tsx              # Dashboard-level loading state
├── crm/
│   ├── error.tsx            # CRM-specific error handling
│   └── loading.tsx
├── sale/
│   ├── error.tsx
│   └── loading.tsx
└── ...
```

#### 5.2 Form State Management

Consider migrating `SaleDetail.tsx` to React Hook Form:

- Current: 15+ `useState` calls for form fields
- Benefit: Built-in validation, dirty tracking, submit handling

#### 5.3 Server-Side Caching

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedDashboardKPIs = unstable_cache(
  async () => getDashboardKPIs(),
  ['dashboard-kpis'],
  { revalidate: 300 } // 5 minutes
)
```

---

## Testing After Upgrade

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint check  
npm run lint

# 3. Unit tests
npm run test

# 4. Build verification
npm run build

# 5. E2E tests (if dev server running)
npm run test:e2e

# 6. Manual smoke test
# - Login → Dashboard loads
# - CRM → Create lead, move through stages
# - Sale → Create quotation, add lines, send
# - Projects → View project, add task
# - Settings → Update company info
```

---

## Rollback Plan

If any upgrade phase causes issues:

```bash
git stash        # or git checkout .
npm install      # Restore original dependencies
npm run build    # Verify working state
```

---

*Generated by VibeCoding Kit v4.0 — XRAY Protocol*
