# Implement: Replace eslint-disable in Component Files

## 🎯 Goal

Remove `eslint-disable @typescript-eslint/no-explicit-any` comments from React component files by replacing `any` types with proper types. Shared Prisma payload types are defined in `src/lib/types.ts`.

## 🏗️ Architecture Context

### Available Shared Types (in src/lib/types.ts)

```typescript
import { Prisma } from '@prisma/client'
export type SaleOrderWithRelations = Prisma.SaleOrderGetPayload<{include: {lines: true; milestones: true; lead: true; createdBy: true; projects: true; quotation: true}}>
export type LeadWithStage = Prisma.CrmLeadGetPayload<{include: {stage: true; assignedTo: true}}>
export type InvoiceWithPayments = Prisma.InvoiceGetPayload<{include: {payments: true; project: true; milestone: true}}>
export type ProjectWithRelations = Prisma.ProjectGetPayload<{include: {phases: {include: {tasks: true}}; manager: true; saleOrder: true; invoices: true; timesheets: true}}>
export type EmployeeWithRole = Prisma.EmployeeGetPayload<{include: {user: true}}>
```

### Also available in types.ts

- `CreateLeadInput`, `UpdateLeadInput`
- `CreateOrderInput`, `UpdateOrderInput`, `OrderLineInput`, `MilestoneInput`
- `CreateInvoiceInput`, `CreatePaymentInput`
- `CreatePhaseInput`, `UpdatePhaseInput`, `CreateTaskInput`, `UpdateTaskInput`
- `CreateEmployeeInput`, `UpdateEmployeeInput`

## 📁 File Map

### Files to MODIFY (check each for eslint-disable)

| File | Strategy |
|------|----------|
| `src/components/SaleDetail.tsx` | Use `SaleOrderWithRelations` for sale order data types |
| `src/components/ChatPanel.tsx` | Type AI tool results, message types |
| `src/components/UserManagement.tsx` | Type user data from server |
| `src/components/AttachmentPanel.tsx` | Type upload/delete callback data |
| `src/components/LeadDetail.tsx` | Use `LeadWithStage` — may have file-level disable |
| `src/components/InvoiceDetail.tsx` | Use `InvoiceWithPayments` — may have file-level disable |
| `src/components/SaleOrderPDF.tsx` | Type PDF data props |
| `src/components/ProjectDetail.tsx` | Use `ProjectWithRelations` |

### Files OFF-LIMITS

- `src/lib/types.ts` — DO NOT modify
- `src/lib/actions/*` — Already handled
- `prisma/schema.prisma` — DO NOT modify

## 📋 Step-by-Step

For EACH component file:

1. Read file to find all `eslint-disable` comments
2. For each disable:
   - If `any` is a component prop → define proper interface or use shared Prisma type
   - If `any` is a state variable → type with proper type
   - If `any` is a catch error → use `unknown` pattern
   - If `any` is genuinely needed (e.g., dynamic Supabase response data) → keep `eslint-disable` with comment explaining WHY
3. Remove `eslint-disable` where possible
4. For file-level `@ts-nocheck` or `eslint-disable` → remove and fix individual types

### Key patterns

```typescript
// Components that receive data from server:
// Props should use the Prisma payload types
interface SaleDetailProps {
  order: SaleOrderWithRelations
  // instead of: order: any
}

// For catch blocks:
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error'
}

// For attachment/file data that comes from API:
interface AttachmentFile {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  createdAt: string
}
```

## ✅ Acceptance Criteria

1. [ ] Maximum possible `eslint-disable` comments removed
2. [ ] Remaining disables have explanatory comments
3. [ ] No business logic changes
4. [ ] No changes to server action files (already handled)
5. [ ] Components render the same as before

## ⚠️ Constraints

- Do NOT change business logic or UI rendering
- Do NOT modify server action files
- Do NOT install new dependencies
- Keep backward compatibility
- If a component file has a file-level `eslint-disable`, try to remove it by fixing individual types. If too complex, keep it with explanation.

## 📊 Report Format

### Changes Made

| File | Disables Removed | Disables Remaining | Notes |
|------|-----------------|-------------------|-------|
