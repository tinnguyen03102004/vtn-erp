# ADR-006: Row Level Security (RLS) Strategy

**Status:** Accepted  
**Date:** 2026-05-12  
**Decision Makers:** Technical Lead

## Context

Supabase exposes API trực tiếp, nên cần RLS để:
1. Prevent unauthorized data access qua PostgREST
2. Defense-in-depth ngoài app-level auth guards
3. Meet security audit requirements

## Decision

- **Enable RLS on all 24 tables** (mandatory, no exceptions)
- **Service-role key only** — App server dùng service role, bypass RLS
- **RLS policies per table** — Minimal policies cho anon access (none for most tables)
- **App-level RBAC** remains primary access control via `requirePermission()`

### Policy Pattern

```sql
-- Default: deny all for anon
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Allow authenticated service role (via server actions)
CREATE POLICY "service_role_all" ON table_name
  FOR ALL USING (auth.role() = 'service_role');
```

## Rationale

1. **Defense-in-depth** — Even if app auth is bypassed, DB blocks unauthorized access
2. **Compliance** — Security best practice for Supabase projects
3. **Simple policies** — Since we use server actions exclusively, policies are straightforward

## Consequences

- Must use `service_role` key in server-side code (already the case)
- Future direct-client features (realtime, etc.) need explicit policies
- All new tables must have RLS enabled before deployment
