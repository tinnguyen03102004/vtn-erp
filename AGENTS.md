<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **vtn-erp** (645 symbols, 2038 relationships, 45 execution flows).

GitNexus provides a knowledge graph over this codebase — call chains, blast radius, execution flows, and semantic search.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring, you must:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/refactoring/SKILL.md` |

## Tools Reference

| Tool | What it gives you |
|------|-------------------|
| `query` | Process-grouped code intelligence — execution flows related to a concept |
| `context` | 360-degree symbol view — categorized refs, processes it participates in |
| `impact` | Symbol blast radius — what breaks at depth 1/2/3 with confidence |
| `detect_changes` | Git-diff impact — what do your current changes affect |
| `rename` | Multi-file coordinated rename with confidence-tagged edits |
| `cypher` | Raw graph queries (read `gitnexus://repo/{name}/schema` first) |
| `list_repos` | Discover indexed repos |

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource | Content |
|----------|---------|
| `gitnexus://repo/{name}/context` | Stats, staleness check |
| `gitnexus://repo/{name}/clusters` | All functional areas with cohesion scores |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Area members |
| `gitnexus://repo/{name}/processes` | All execution flows |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace |
| `gitnexus://repo/{name}/schema` | Graph schema for Cypher |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```

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