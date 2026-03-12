# Implement: Shared Prisma Payload Types

## 🎯 Goal

Create shared TypeScript type definitions using Prisma's `GetPayload` utility types in `src/lib/types.ts` so that all server actions and components can use proper types instead of `any`.

## 🏗️ Architecture Context

### Project Structure

```
src/
├── lib/
│   ├── types.ts          ← ADD types here
│   ├── actions/
│   │   ├── sale.ts       ← uses SaleOrder with relations
│   │   ├── crm.ts        ← uses CrmLead with stage
│   │   ├── finance.ts    ← uses Invoice with payments
│   │   ├── projects.ts   ← uses Project with phases/tasks
│   │   └── employees.ts  ← uses Employee data
│   └── schemas.ts        ← Zod schemas (reference)
├── components/
│   ├── SaleDetail.tsx     ← needs SaleOrderWithRelations
│   ├── LeadDetail.tsx     ← needs LeadWithStage
│   ├── InvoiceDetail.tsx  ← needs InvoiceWithPayments
│   └── ProjectDetail.tsx  ← needs ProjectWithRelations
prisma/
└── schema.prisma          ← READ this for relation definitions
```

### Key Dependencies

- Framework: Next.js 16 + TypeScript
- ORM: Prisma 7.4.2
- Database: PostgreSQL (Supabase)

## 📁 File Map

### Files to MODIFY

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add Prisma payload types at the end of file |

### Files to READ (context only, DO NOT modify)

| File | Why |
|------|-----|
| `prisma/schema.prisma` | Understand model relations (include fields) |
| `src/lib/actions/sale.ts` | See how SaleOrder queries use `include` |
| `src/lib/actions/crm.ts` | See how CrmLead queries use `include` |
| `src/lib/actions/finance.ts` | See how Invoice queries use `include` |
| `src/lib/actions/projects.ts` | See how Project queries use `include` |

### Files OFF-LIMITS

- All component files (Phase 2C will handle those)
- All server action files (Phase 2B will handle those)
- `prisma/schema.prisma` (DO NOT modify schema)

## 📋 Step-by-Step

1. Read `prisma/schema.prisma` to understand model relations
2. Read `src/lib/actions/sale.ts` — find the Prisma `include` patterns used in queries
3. Read `src/lib/actions/crm.ts` — same
4. Read `src/lib/actions/finance.ts` — same
5. Read `src/lib/actions/projects.ts` — same
6. Read existing `src/lib/types.ts` to see what's already there
7. Add to `src/lib/types.ts`:

```typescript
import { Prisma } from '@prisma/client'

// === Prisma Payload Types ===

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

export type EmployeeWithRole = Prisma.EmployeeGetPayload<{
  include: { department: true }
}>
```

1. Adjust the `include` types to MATCH the actual Prisma `include` patterns used in the server action files. The examples above are guidelines — use the EXACT includes found in the actual queries.

## ✅ Acceptance Criteria

1. [ ] Types added to `src/lib/types.ts`
2. [ ] Types match actual Prisma include patterns from server actions
3. [ ] `npx tsc --noEmit` passes with 0 errors
4. [ ] No other files modified

## ⚠️ Constraints

- Do NOT modify any files other than `src/lib/types.ts`
- Do NOT change existing types in the file
- Do NOT install new dependencies
- Do NOT modify Prisma schema
- MATCH the actual include patterns — don't guess

## 📊 Report Format

When done, output a summary:

### Changes Made

| File | Action | Description |
|------|--------|-------------|
| `src/lib/types.ts` | Modified | Added X Prisma payload types |

### Types Created

- List each type name and its include fields

### Verification

- `npx tsc --noEmit`: ✅/❌
