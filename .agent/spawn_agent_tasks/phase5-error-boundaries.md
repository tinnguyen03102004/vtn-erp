# CODER PACK: Phase 5 — Error Boundaries & Loading States

## Goal
Add `error.tsx` and `loading.tsx` files to every route group under `(dashboard)/`.
These provide graceful error recovery and loading skeleton UX across all pages.

## Architecture Context

### Route Groups (from scan)
```
src/app/(dashboard)/
├── dashboard/          → page.tsx
├── crm/                → page.tsx, [id]/page.tsx
├── sale/               → page.tsx, [id]/page.tsx, new/page.tsx
├── projects/           → page.tsx, [id]/page.tsx
├── finance/            → page.tsx, invoices/page.tsx, invoices/[id]/page.tsx
├── employees/          → page.tsx
├── reports/            → page.tsx
├── settings/           → page.tsx
├── timesheets/         → page.tsx
└── layout.tsx          → Already has loading spinner for auth
```

### Design System
- Font: `Plus Jakarta Sans`
- Primary: `#1F3A5F`
- Accent: `#8FA3BF`
- Background: `#F8F9FB`
- Dashboard layout already wraps children with `<main className="page-content">`

## Files to Create (16 total)

### Shared `error.tsx` Pattern (Client Component)
```tsx
'use client'
export default function XError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="error-boundary">
            <h2>Có lỗi xảy ra</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Thử lại</button>
        </div>
    )
}
```

### Shared `loading.tsx` Pattern (Server Component)
```tsx
export default function XLoading() {
    return (
        <div className="loading-skeleton">
            <div className="skeleton-header" />
            <div className="skeleton-grid">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
            </div>
        </div>
    )
}
```

### File List
1. `src/app/(dashboard)/error.tsx` — Dashboard-level error boundary
2. `src/app/(dashboard)/loading.tsx` — Dashboard-level loading
3. `src/app/(dashboard)/crm/error.tsx`
4. `src/app/(dashboard)/crm/loading.tsx`
5. `src/app/(dashboard)/sale/error.tsx`
6. `src/app/(dashboard)/sale/loading.tsx`
7. `src/app/(dashboard)/projects/error.tsx`
8. `src/app/(dashboard)/projects/loading.tsx`
9. `src/app/(dashboard)/finance/error.tsx`
10. `src/app/(dashboard)/finance/loading.tsx`
11. `src/app/(dashboard)/employees/error.tsx`
12. `src/app/(dashboard)/employees/loading.tsx`
13. `src/app/(dashboard)/reports/error.tsx`
14. `src/app/(dashboard)/reports/loading.tsx`
15. `src/app/(dashboard)/settings/error.tsx`
16. `src/app/(dashboard)/settings/loading.tsx`
17. `src/app/(dashboard)/timesheets/error.tsx`
18. `src/app/(dashboard)/timesheets/loading.tsx`
19. `src/app/globals.css` — Add skeleton/error-boundary styles (APPEND)

## Conventions
- `error.tsx` must be `'use client'` (Next.js requirement)
- `loading.tsx` can be server component (no 'use client')
- Vietnamese labels (Có lỗi xảy ra, Thử lại, Đang tải...)
- Each error page shows module name for context
- Loading skeletons mimic actual page layout (cards, tables)
- CSS added to globals.css, not inline

## Acceptance Criteria
- [x] `tsc --noEmit` passes
- [x] `npx vitest run` passes (181 tests)
- [x] Every route group has error.tsx + loading.tsx
- [x] Error boundaries show "Thử lại" button that calls reset()
- [x] Loading skeletons animate with pulse effect
