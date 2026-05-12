# ADR-002: HMAC Server-Side Sessions

## Status

**Accepted** — 2026-03-09

## Context

Hệ thống cần authentication mechanism:
- Secure, không expose user data trong cookie
- Không phụ thuộc external auth provider (self-hosted)
- Nhanh — route-level check không cần DB query mỗi request
- Phù hợp enterprise (session management, force logout)

## Decision

Sử dụng **server-side sessions** (Odoo-style) với **HMAC-SHA256 signed cookies**.

## Architecture

```
Login → bcrypt verify → Create session row → HMAC-sign token → Set cookie
Request → Verify HMAC (no DB) → If valid, proceed
Action → Lookup session in DB → Get fresh user data → Check RBAC
```

### Components

| Component | Role |
|-----------|------|
| `session.ts` | Core: create/get/delete/verify session |
| `proxy.ts` | Route guard: verify HMAC signature (fast, no DB) |
| `auth-guard.ts` | Action guard: lookup session in DB (authoritative) |
| `app_sessions` table | Session storage (token, userId, expiry, IP, userAgent) |

### Cookie Structure

```
Cookie: vtn-session=<session_token>.<hmac_signature>
Attributes: httpOnly, secure, sameSite=Strict, maxAge=7d
```

## Rationale

1. **Two-layer verification**: HMAC for speed (route guard), DB for authority (action guard)
2. **No user data in cookie**: Unlike JWT, cookie only contains opaque token
3. **Session revocation**: Can force logout by deleting session row
4. **IP/UserAgent tracking**: Detect session hijacking
5. **No external dependencies**: Unlike NextAuth, Clerk, Auth0

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| NextAuth.js | Easy setup, many providers | Complex config, provider lock-in |
| JWT-only | Stateless, scalable | Can't revoke, token bloat |
| Supabase Auth | Built-in, GoTrue | Less control, RLS complexity |
| Clerk | Great DX, managed | Vendor lock-in, cost |

## Consequences

- Self-maintained auth code (but simple, ~200 lines)
- Must manage session cleanup (expired sessions)
- No OAuth/social login (can add later)
- Password management is our responsibility (bcrypt)
