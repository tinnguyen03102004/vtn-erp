# Implement: Replace eslint-disable in Server Action Files

## 🎯 Goal

Remove `eslint-disable @typescript-eslint/no-explicit-any` comments from server action files by replacing `any` types with proper Prisma payload types or specific TypeScript types. The shared types are already defined in `src/lib/types.ts`.

## 🏗️ Architecture Context

### Available Shared Types (in src/lib/types.ts)

```typescript
import { Prisma } from '@prisma/client'

export type SaleOrderWithRelations = Prisma.SaleOrderGetPayload<{
    include: { lines: true; milestones: true; lead: true; createdBy: true; projects: true; quotation: true }
}>

export type LeadWithStage = Prisma.CrmLeadGetPayload<{
    include: { stage: true; assignedTo: true }
}>

export type InvoiceWithPayments = Prisma.InvoiceGetPayload<{
    include: { payments: true; project: true; milestone: true }
}>

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        phases: { include: { tasks: true } }; manager: true; saleOrder: true; invoices: true; timesheets: true
    }
}>

export type EmployeeWithRole = Prisma.EmployeeGetPayload<{
    include: { user: true }
}>
```

### Project uses Supabase client (NOT Prisma client) for queries

The codebase uses `supabase.from('table').select('*')` pattern. Prisma types are used ONLY for type annotations, not for queries.

## 📁 File Map

### Files to MODIFY

| File | eslint-disables | Strategy |
|------|----------------|----------|
| `src/lib/actions/sale.ts` | ~7 | Type query results, function params with proper types |
| `src/lib/actions/crm.ts` | ~3 | Type lead data with LeadWithStage or specific types |
| `src/lib/actions/finance.ts` | ~3 | Type invoice data with InvoiceWithPayments |
| `src/lib/actions/projects.ts` | ~3 | Type project data with ProjectWithRelations |
| `src/lib/actions/employees.ts` | ~3 | Type employee data with EmployeeWithRole |
| `src/lib/actions/dashboard.ts` | ~1 | Type dashboard query results |

### Files OFF-LIMITS

- `src/lib/types.ts` — DO NOT modify (already complete)
- `src/components/*` — Phase 2C handles components
- `prisma/schema.prisma` — DO NOT modify

## 📋 Step-by-Step

1. For EACH file above:
   a. Read the file to find all `eslint-disable` comments
   b. For each `eslint-disable`:
      - If the `any` is a function parameter: type it with a specific type
      - If the `any` is a variable: type it with the correct type
      - If the `any` is a catch error: use `unknown` and cast or check
      - If the `any` is genuinely needed (e.g., Supabase dynamic query result): type it as `Record<string, unknown>` or the specific shape
   c. Remove the `eslint-disable` comment
   d. If you CANNOT remove an `any` without breaking things, leave the eslint-disable but add a brief comment explaining WHY

2. Common patterns to apply:

```typescript
// BEFORE:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch (err: any) {
  return { success: false, error: err.message }
}

// AFTER:
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  return { success: false, error: message }
}
```

```typescript
// BEFORE:
// eslint-disable-next-line @typescript-eslint/no-explicit-any  
const data = result.data as any[]

// AFTER:
const data = result.data as SaleOrderWithRelations[]
```

## 🎨 Conventions

- Use `unknown` instead of `any` for error catches
- Use `Record<string, unknown>` for generic object shapes
- Import types from `@/lib/types` using the `@/` alias
- Keep `'use server'` directive at top of files
- Do NOT change any business logic — only type annotations

## ✅ Acceptance Criteria

1. [ ] All possible `eslint-disable @typescript-eslint/no-explicit-any` removed
2. [ ] Remaining disables (if any) have explanatory comments
3. [ ] No business logic changes
4. [ ] `npx tsc --noEmit` still passes (run in your head — verify types match)
5. [ ] File structure unchanged

## ⚠️ Constraints

- Do NOT change business logic
- Do NOT change function signatures that break callers
- Do NOT modify component files
- Do NOT install new dependencies
- Keep backward compatibility

## 📊 Report Format

### Changes Made

| File | Disables Removed | Disables Remaining | Notes |
|------|-----------------|-------------------|-------|

### Verification

- Types check: manually verified / tsc result
