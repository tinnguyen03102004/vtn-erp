# ADR-001: Use Next.js App Router

## Status

**Accepted** — 2026-02-28

## Context

VTN ERP cần framework web hỗ trợ:
- Server-side rendering cho SEO và performance
- Full-stack capabilities (API routes + server actions)
- TypeScript first-class support
- Phù hợp cho enterprise application

## Decision

Sử dụng **Next.js 16** với **App Router** làm framework chính.

## Rationale

1. **App Router** — Hỗ trợ React Server Components, giảm client-side JavaScript
2. **Server Actions** — Cho phép viết business logic phía server mà không cần tạo API routes riêng
3. **Turbopack** — Dev server nhanh hơn Webpack
4. **Ecosystem** — Large ecosystem, community support, Vercel hosting integration
5. **Full-stack** — API routes cho AI chat, PDF generation, file upload

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Remix | Nested routing, progressive enhancement | Smaller ecosystem |
| Vite + Express | Flexible, fast dev | No SSR built-in, more setup |
| NestJS + React | Clean backend architecture | Two separate apps, more complexity |

## Consequences

- Lock-in vào Vercel ecosystem (mitigation: Docker for self-hosting)
- Server Components learning curve
- Phải cẩn thận với `'use client'` boundary
