# ADR-003: Supabase as Primary Data Access

## Status

**Accepted** — 2026-03-09

## Context

Dự án cần database solution cho:
- PostgreSQL hosting (managed)
- Real-time capabilities (future)
- File storage (upload tài liệu)
- Row Level Security (RLS)
- Easy setup, developer-friendly

## Decision

Sử dụng **Supabase JS** làm primary data access layer. **Prisma** giữ vai trò schema modeling.

## Architecture

```
┌─────────────────────────────────────────┐
│            Server Actions               │
│                                         │
│   ┌───────────────┐  ┌──────────────┐  │
│   │  Supabase JS  │  │    Prisma    │  │
│   │  (15+ files)  │  │  (1-2 files) │  │
│   │  CRUD runtime │  │ Schema/model │  │
│   └───────┬───────┘  └──────┬───────┘  │
│           │                  │          │
│           ▼                  ▼          │
│        Supabase API     Direct PG      │
│           │                  │          │
│           └──────┬───────────┘          │
│                  ▼                      │
│           PostgreSQL 17.6               │
└─────────────────────────────────────────┘
```

## Rationale

1. **Supabase JS cho CRUD**: Đơn giản, type-safe, auto RLS filtering
2. **Prisma cho schema**: `schema.prisma` as documentation, migration tracking
3. **No split brain**: Hai tool phục vụ mục đích khác nhau
4. **Storage**: Supabase Storage cho file uploads (documents bucket)
5. **Future**: Real-time subscriptions when needed

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Prisma-only | One tool, familiar ORM | No RLS, no storage, no realtime |
| Drizzle | Type-safe, lightweight | Smaller ecosystem |
| Direct SQL | Maximum control | Verbose, SQL injection risk |
| Firebase | Real-time, auth built-in | Not PostgreSQL, vendor lock-in |

## Consequences

- Must sync Prisma schema with Supabase schema manually
- Supabase JS doesn't support transactions natively
- RLS policies managed via Supabase Dashboard (not in code)
- Team must understand both Supabase JS and Prisma APIs
