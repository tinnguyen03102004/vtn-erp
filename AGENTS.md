<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **vtn-erp** (1537 symbols, 3482 relationships, 116 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/vtn-erp/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/vtn-erp/context` | Codebase overview, check index freshness |
| `gitnexus://repo/vtn-erp/clusters` | All functional areas |
| `gitnexus://repo/vtn-erp/processes` | All execution flows |
| `gitnexus://repo/vtn-erp/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

<!-- supabase:start -->
# Supabase Infrastructure

## Active Project

| Key | Value |
|-----|-------|
| **Project Name** | VTN ERP |
| **Project ID** | `obewplzrudymjchbzpdc` |
| **Region** | ap-southeast-1 |
| **Database Host** | `db.obewplzrudymjchbzpdc.supabase.co` |
| **API URL** | `https://obewplzrudymjchbzpdc.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/obewplzrudymjchbzpdc |

> [!CAUTION]
> **KHÔNG sử dụng** project `archstudio-erp` (ID: `cmnsgazvqtvpiqbclvix`) cho VTN ERP.
> Project đó thuộc repo 9Nghĩa (Mekong ERP), chỉ chứa data của 9Nghĩa.
> Mọi query/migration cho VTN ERP **PHẢI** dùng project ID `obewplzrudymjchbzpdc`.

## Demo Accounts

Tất cả tài khoản dùng password: `password123`

| Email | Role | Tên | Mô tả |
|-------|------|-----|-------|
| `hang@vtn.vn` | DIRECTOR | Trần Thị Hằng | Giám đốc — full quyền (như admin) |
| `pm@vtn.vn` | PROJECT_MANAGER | Nguyễn Minh Khoa | Quản lý dự án |
| `tung@vtn.vn` | ARCHITECT | Nguyễn Văn Tùng | Kiến trúc sư |
| `quyen@vtn.vn` | FINANCE | Hà Thị Mỹ Quyên | Kế toán / tài chính |

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://obewplzrudymjchbzpdc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZXdwbHpydWR5bWpjaGJ6cGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTU1OTMsImV4cCI6MjA4ODI3MTU5M30.inSAk4A9lgjWSfYeNWNq7tNxB1Hq5lCdhvw_w6fcU6Y
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
AUTH_SECRET=<HMAC-SHA256 key for session cookie signing>
OPENAI_API_KEY=sk-...
```

## Database Tables

| Table | Mục đích |
|-------|----------|
| `users` | Tài khoản đăng nhập, role, password (bcrypt) |
| `employees` | Thông tin nhân viên (liên kết userId) |
| `app_sessions` | Server-side sessions (HMAC-signed cookie) |
| `crm_stages` | Pipeline stages cho CRM |
| `crm_leads` | Leads/cơ hội kinh doanh |
| `sale_orders` | Báo giá & hợp đồng |
| `sale_order_lines` | Dòng dịch vụ trong báo giá |
| `sale_milestones` | Milestone thanh toán |
| `projects` | Dự án kiến trúc |
| `project_phases` | Giai đoạn dự án |
| `project_tasks` | Tasks trong dự án |
| `invoices` | Hóa đơn |
| `payments` | Thanh toán |
| `timesheets` | Chấm công theo giờ |
| `audit_logs` | Nhật ký thao tác |
| `settings` | Cài đặt công ty |
| `attachments` | File đính kèm |

<!-- supabase:end -->

---

<!-- conventions:start -->
# Project Conventions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Radix UI, Recharts |
| Language | TypeScript 5 |
| Database | PostgreSQL (Supabase hosted) |
| Data Access | Supabase JS (primary), Prisma (schema/modeling) |
| Auth | Server-side sessions (HMAC-signed cookie → `app_sessions` table) |
| AI | OpenAI Chat Completions + tool calling |
| Styling | Tailwind CSS 4 + global CSS |
| PDF | @react-pdf/renderer |

## Architecture Pattern

- **Modular monolith** trên Next.js App Router
- Server Actions cho business logic (`src/lib/actions/`)
- RBAC via `src/lib/rbac.ts` — permission matrix theo role
- Auth guard: HMAC signature verify (proxy.ts) + DB session lookup (auth-guard.ts)

## Business Flow

```
Lead → Quotation → Contract → Project → Phases → Milestones → Invoice → Payment
                                          └→ Tasks → Timesheet
```

## Key Directories

```
src/app/(dashboard)/     → Route pages theo module
src/lib/actions/         → Server actions (business logic)
src/lib/ai/             → AI tools & chat handler
src/components/          → UI components
packages/vietnam/        → Vietnam-specific utils (tax, insurance, VietQR)
packages/schemas/        → Zod validation schemas
packages/shared/         → Shared types
```

## Coding Rules

- Supabase JS là data access chính, KHÔNG dùng Prisma cho runtime queries
- Tất cả mutations phải có `requireAuth()` + `requirePermission()` guard
- ActionResult<T> pattern cho error handling
- Zod schemas cho input validation
- Audit logging cho hành động quan trọng

<!-- conventions:end -->
