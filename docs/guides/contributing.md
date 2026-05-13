# Contributing Guide

## Development Workflow

### 1. Branch Strategy

```
main ← feature/xxx ← PR
```

- `main` — Production-ready code
- `feature/<module>-<description>` — Feature branches
- `fix/<issue>` — Bug fixes

### 2. Commit Convention

```
<type>(<scope>): <description>

feat(payroll): add VietQR payment integration
fix(crm): prevent duplicate lead creation
docs(api): add server actions documentation
test(attendance): add review workflow tests
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

### 3. Code Quality Gates

Before pushing, ensure:

```bash
npm run lint          # ESLint check
npx tsc --noEmit     # TypeScript typecheck
npm test             # Unit tests (283+ tests)
npm run build        # Production build
```

CI/CD runs all 4 gates automatically on every PR.

## Coding Standards

### Server Actions

All server actions must follow this pattern:

```typescript
export async function myAction(input: unknown): Promise<ActionResult<T>> {
    // 1. Auth guard
    const user = await requirePermission('module.action')
    
    // 2. Input validation
    const parsed = parseInput(schema, input)
    if (!parsed.success) return fail(parsed.error, parsed.fieldErrors)
    
    // 3. Business logic
    const { data, error } = await db.from('table')...
    if (error) return fail(error.message)
    
    // 4. Audit log
    await logAudit({ userId: user.id, action: 'create', entity: 'thing', entityId: data.id, details: '...' })
    
    // 5. Return typed result
    return ok(data)
}
```

### Testing

Tests go in `src/lib/__tests__/actions/<module>.test.ts`:

```typescript
// Mock pattern (use createMockChain helper)
import { createMockChain } from '../helpers/supabase-mock'

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => mockChain } }))
vi.mock('@/lib/auth-guard', () => ({
    requireAuth: () => Promise.resolve(mockUser),
    requirePermission: () => Promise.resolve(mockUser),
}))
vi.mock('@/lib/audit', () => ({ logAudit: () => Promise.resolve() }))
```

### RBAC

Permissions are defined in `packages/auth/src/rbac.ts`. To add a new permission:
1. Add to the permission matrix in `rbac.ts`
2. Use `requirePermission('module.action')` in the server action
3. Document in `docs/api/README.md`

### New Tables

When adding a new table:
1. Create migration via Supabase Dashboard
2. Update `prisma/schema.prisma`
3. **Enable RLS** (mandatory — ADR-006)
4. Add to `docs/database/schema.md`
5. Update architecture diagram if needed

## Key Files Reference

| What | Where |
|------|-------|
| Server actions | `src/lib/actions/` |
| UI components | `src/components/` |
| Route pages | `src/app/(dashboard)/` |
| Auth guard | `src/lib/auth-guard.ts` |
| RBAC matrix | `packages/auth/src/rbac.ts` |
| VN business logic | `packages/vietnam/` |
| Zod schemas | `packages/schemas/` |
| Test helpers | `src/lib/__tests__/helpers/` |
| ADRs | `docs/adr/` |
