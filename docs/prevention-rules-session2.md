# Debug Session #2 — Prevention Rules (2026-03-13)

## Bug P-001: Sidebar renders forbidden links
- **Bug**: Sidebar shows all nav items regardless of user role → user clicks → gets 403 Forbidden
- **Root Cause**: `Sidebar.tsx` never used the `roles` metadata defined on each nav item to filter rendering
- **Prevention**: Always filter client-side navigation by user role. Treat `roles` on nav items as render conditions, not just documentation. Backend RBAC is defense-in-depth; UI filtering is UX.

## Bug P-002: ActionResult not unwrapped in SettingsContent
- **Bug**: `saveSettings()` result shown as success regardless of `result.success` value
- **Root Cause**: Code used `await action(); addToast('success')` pattern instead of checking `ActionResult.success`
- **Prevention**: ALL server actions in this app return `ActionResult<T>`. EVERY call site must check `.success` before assuming success. Never rely on `try/catch` alone — the action returns errors in the result, not by throwing.

## Bug P-003: Zod null vs undefined mismatch
- **Bug**: `stageId: z.string().uuid().optional()` rejects `null` from frontend
- **Root Cause**: Zod `.optional()` only accepts `undefined`, not `null`. React state uses `null` for "no value".
- **Prevention**: When a schema field may receive `null` from React state, use `.or(z.null().transform(() => undefined))` to normalize. Alternatively, convert null → undefined in the component before passing to the action.
