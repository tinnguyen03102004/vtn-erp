# Getting Started

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 20.0.0 | LTS recommended |
| npm | ≥ 10.0.0 | Comes with Node.js |
| Git | Latest | Version control |
| Supabase account | — | Or local PostgreSQL |
| OpenAI API key | — | Optional, for AI features |

## Quick Setup

### 1. Clone & Install

```bash
git clone https://github.com/tinnguyen03102004/vtn-erp.git
cd vtn-erp
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/vtn_erp
AUTH_SECRET=your-hmac-secret-key-min-32-chars

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Database Setup

**Option A — Supabase (Recommended)**:
1. Create project at [supabase.com](https://supabase.com)
2. Copy URL and anon key to `.env`
3. Run migrations via Supabase Dashboard

**Option B — Local PostgreSQL via Docker**:
```bash
docker compose up -d postgres
npx prisma generate
npx prisma db push
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login

Use demo accounts (password: `password123`):

| Email | Role | Name |
|-------|------|------|
| `director@vtn.vn` | DIRECTOR | Nguyễn Văn Nam |
| `pm@vtn.vn` | PROJECT_MANAGER | Trần Minh Khoa |
| `arch@vtn.vn` | ARCHITECT | Lê Thu Hương |
| `finance@vtn.vn` | FINANCE | Phạm Thị Khánh Linh |
| `sales@vtn.vn` | SALES | Đỗ Thị Hoàng Yến |

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Run unit tests (vitest) |
| `npm run lint` | ESLint check |
| `make test-e2e` | Run E2E tests (Playwright) |
| `make db-studio` | Open Prisma Studio |
| `make clean` | Clean build artifacts |

## Docker Setup (Alternative)

```bash
# Start full stack (PostgreSQL + Redis + App)
docker compose up -d

# View logs
docker compose logs -f web

# Stop
docker compose down
```

## Project Structure

```
src/
├── app/                 # Next.js pages & routes
│   ├── (dashboard)/     # Authenticated routes
│   ├── login/           # Login page
│   └── api/             # API routes
├── components/          # React components
├── lib/
│   ├── actions/         # Server actions (business logic)
│   ├── ai/              # AI tools & chat
│   ├── session.ts       # Session management
│   ├── auth-guard.ts    # Auth enforcement
│   ├── rbac.ts          # Permission matrix
│   └── supabase.ts      # Supabase client
packages/
├── vietnam/             # VN business logic
├── schemas/             # Zod schemas
├── shared/              # Shared types
├── logger/              # Logging
└── ...                  # Other packages
```

## Troubleshooting

### `Module "server-only" not found`
This is expected in test environment. The test suite mocks `server-only`.

### `NEXT_PUBLIC_SUPABASE_URL is required`
Ensure `.env` has Supabase credentials.

### Port 3000 in use
```bash
npx kill-port 3000
npm run dev
```

## Next Steps

- Read [Architecture Overview](../architecture/overview.md)
- Check [CONTRIBUTING.md](../../CONTRIBUTING.md) for dev workflow
- Review [ROADMAP.md](../../ROADMAP.md) for planned features
