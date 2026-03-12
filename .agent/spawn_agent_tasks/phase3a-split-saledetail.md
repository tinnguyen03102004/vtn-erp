# Implement: Split SaleDetail.tsx into 5 sub-components

## 🎯 Goal
Decompose `src/components/SaleDetail.tsx` (409 lines) into smaller, focused sub-components under `src/components/sale/` folder. The main file should become a thin container (~100 lines) that imports and orchestrates sub-components.

## 📁 Target File Structure

```
src/components/sale/
├── SaleDetail.tsx          # Main container: state, routing, toast, tabs layout (~100-120 lines)
├── SaleOrderForm.tsx       # Form fields: partner info, dates, notes, edit mode
├── SaleOrderLines.tsx      # Line items table: add/edit/delete rows, subtotal calc
├── SaleMilestones.tsx      # Milestone management: list, add, progress bar
└── SaleStateActions.tsx    # State machine buttons: send, approve, reject, sign, convert
```

## 📋 Step-by-Step

1. **Read** `src/components/SaleDetail.tsx` completely to understand the full component

2. **Create** `src/components/sale/` directory

3. **Extract `SaleOrderForm.tsx`**:
   - Partner info fields (name, email, phone, address)
   - Order notes/description
   - Edit/save/cancel toggle
   - Props: `order`, `onSave`, `isEditing`, etc.

4. **Extract `SaleOrderLines.tsx`**:
   - Order lines table with columns (description, qty, unit price, subtotal)
   - Add/edit/delete line functionality
   - Total calculation
   - Props: `orderId`, `lines`, `onLinesChange`

5. **Extract `SaleMilestones.tsx`**:
   - Milestone list with progress indicators
   - Add milestone form
   - Milestone state management
   - Props: `orderId`, `milestones`, `onMilestoneChange`

6. **Extract `SaleStateActions.tsx`**:
   - State-dependent action buttons (based on order state machine)
   - Send quotation, approve, reject, sign contract, convert to project
   - Confirmation dialogs before state transitions
   - Props: `order`, `onStateChange`, callbacks

7. **Rewrite `SaleDetail.tsx`** as the main container:
   - Keep: state management (useState), data fetching, router, toast
   - Import and render sub-components
   - Pass handlers as props
   - Tab layout if present
   - Should be ~100-120 lines max

8. **Update import** in `src/app/(dashboard)/sale/[id]/page.tsx`:
   - Change import path from `'@/components/SaleDetail'` → `'@/components/sale/SaleDetail'`

## 🎨 Conventions

- All components are `'use client'` (they use hooks)
- Use `@/` path alias for imports
- Import server actions in the main SaleDetail only, pass handlers down
- Import `formatCurrency`, `formatDate` from `'@/lib/utils'` where needed
- Keep ToastContainer only in the main container
- Export each sub-component as `default`
- TypeScript interfaces for all props

## ✅ Acceptance Criteria

1. [ ] 5 files created in `src/components/sale/`
2. [ ] `SaleDetail.tsx` is ≤120 lines
3. [ ] All sub-components have typed Props interfaces
4. [ ] Import path updated in sale page
5. [ ] No business logic changes — UI renders exactly the same
6. [ ] No new dependencies added

## ⚠️ Constraints

- Do NOT change any business logic
- Do NOT modify server action files
- Do NOT change styling/CSS
- Keep ALL existing functionality working
- The original `src/components/SaleDetail.tsx` should be DELETED after migration (or can remain as redirect import)
- Don't break other files that might import from the old path

## 📊 Report Format

### Changes Made
| File | Action | Lines |
|------|--------|-------|

### Verification
- Component structure matches target
- All imports resolved
