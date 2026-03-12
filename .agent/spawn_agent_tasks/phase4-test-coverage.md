# CODER PACK: Phase 4 — Test Coverage for Server Actions

## 🎯 Goal
Create comprehensive unit tests for server action files using Vitest. 
Mock Supabase client, auth-guard, and audit logger. 
Test both success and error paths for critical business logic.

## 📐 Architecture Context

### Tech Stack
- **Test runner**: Vitest (config: `vitest.config.ts`)
- **Environment**: Node
- **Globals**: `describe`, `it`, `expect` from vitest
- **Path alias**: `@/` → `src/`
- **Pattern**: `src/**/*.test.ts`

### Server Action Pattern (ALL actions follow this)
```typescript
'use server'
import { supabase } from '@/lib/supabase'
import { requirePermission } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/action-result'
import { parseInput } from '@/lib/schemas'
import { logAudit } from '@/lib/audit'

export async function createSomething(formData: unknown): Promise<ActionResult<Record<string, unknown>>> {
    const user = await requirePermission('module.edit')
    const parsed = parseInput(schema, formData)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    const { data, error } = await supabase.from('table').insert(parsed.data as any).select().single()
    if (error) return fail(error.message)
    await logAudit({ userId: user.id, action: 'create', ... })
    return ok(data as any)
}
```

### What to Mock
1. `@/lib/supabase` → mock `supabase.from()` chain (`.select()`, `.insert()`, `.update()`, `.delete()`, `.eq()`, `.single()`, `.order()`)
2. `@/lib/auth-guard` → mock `requirePermission()` → returns `{ id: 'user-1', email: 'test@vtn.com', role: 'admin' }`
3. `@/lib/audit` → mock `logAudit()` → no-op
4. `@/lib/schemas` → DO NOT MOCK — test real validation

## 📁 Target File Structure

```
src/lib/__tests__/
├── helpers/
│   └── supabase-mock.ts       # Shared Supabase mock factory
├── actions/
│   ├── crm.test.ts            # Lead CRUD + stage transitions
│   ├── sale.test.ts           # Order CRUD + state machine (DRAFT→SENT→APPROVED→CONTRACT→SIGNED)
│   ├── projects.test.ts       # Project + phase + task CRUD
│   ├── finance.test.ts        # Invoice CRUD + payment recording
│   └── dashboard.test.ts      # KPI aggregation queries
├── validation.test.ts         # ✅ EXISTS
├── utils.test.ts              # ✅ EXISTS
├── session.test.ts            # ✅ EXISTS
├── schemas.test.ts            # ✅ EXISTS
├── rbac.test.ts               # ✅ EXISTS
└── action-result.test.ts      # ✅ EXISTS
```

## 📋 Step-by-Step

### Step 1: Create Supabase Mock Helper

File: `src/lib/__tests__/helpers/supabase-mock.ts`

Create a reusable mock factory that simulates the Supabase query builder chain:

```typescript
import { vi } from 'vitest'

export function createSupabaseMock() {
    const mockData = { data: null, error: null }
    
    const chain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockData),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(mockData),
        then: vi.fn((resolve) => resolve(mockData)),
    }
    
    // Make chain promise-like (for queries without .single())
    chain.select.mockImplementation(() => {
        const p = Promise.resolve(mockData)
        Object.assign(p, chain)
        return p
    })
    
    const supabase = {
        from: vi.fn().mockReturnValue(chain),
    }
    
    return { supabase, chain, setResult: (data, error = null) => { mockData.data = data; mockData.error = error } }
}
```

### Step 2: Create CRM Tests (`crm.test.ts`)

Test functions: `getStages`, `getLeads`, `getLeadsByStage`, `getLead`, `createLead`, `updateLead`

Test cases:
- `getStages` returns ordered stages
- `getLeads` returns leads sorted by date
- `getLeadsByStage` groups leads by stage
- `createLead` with valid data → success
- `createLead` with missing name → validation error
- `updateLead` with valid data → success
- `updateLead` with invalid data → error

### Step 3: Create Sale Tests (`sale.test.ts`)

Test functions: `getOrders`, `getOrder`, `createOrder`, `deleteOrder`, `updateOrderState`, `saveOrderLines`, `saveMilestones`, `sendQuotation`, `approveQuotation`, `rejectQuotation`, `convertToContract`, `signContract`, `convertOrderToProject`

Key test cases:
- State machine: DRAFT → SENT → APPROVED → Contract (NEGOTIATING → SIGNED → DONE)
- `createOrder` with valid quotation data
- `saveOrderLines` creates/updates/deletes line items
- `convertToContract` creates new contract from quotation
- Error handling: Supabase errors return fail()

### Step 4: Create Projects Tests (`projects.test.ts`)

Test functions: `getProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`, `createPhase`, `createTask`, `updateTask`

### Step 5: Create Finance Tests (`finance.test.ts`)

Test functions: `getInvoices`, `createInvoice`, `recordPayment`, `getPayments`

### Step 6: Create Dashboard Tests (`dashboard.test.ts`)

Test function: `getDashboardData` — verify KPI aggregation queries

### Step 7: Verify All Tests Pass

```bash
npx vitest run
```

## 🎨 Conventions

- Import `describe, it, expect, vi, beforeEach` from 'vitest'
- Use `vi.mock()` at module level for all dependencies
- Reset mocks in `beforeEach`
- Test both success and error paths
- Use Vietnamese test descriptions matching the business domain
- Each test file ≤ 150 lines
- No external API calls — everything mocked

## ✅ Acceptance Criteria

1. [ ] Mock helper created in `helpers/supabase-mock.ts`
2. [ ] 5 test files created in `actions/` directory
3. [ ] Each test file covers success + error paths
4. [ ] All tests pass: `npx vitest run` → 0 failures
5. [ ] Total test count ≥ 160 (125 existing + 35+ new)
6. [ ] No flaky tests (no real API calls)

## ⚠️ Constraints

- Do NOT modify production code
- Do NOT add new dependencies
- Mock at module level, not function level
- Each test must be independent (no shared mutable state between tests)
- Keep tests focused: 1 assertion per test when possible
