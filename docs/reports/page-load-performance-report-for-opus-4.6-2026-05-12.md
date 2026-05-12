# Bao cao loi load cham trang VTN ERP cho Agent Opus 4.6

Ngay lap bao cao: 2026-05-12  
Repo: `C:\Users\tinnh\.gemini\antigravity\workspaces\vtn-erp`  
Muc tieu: giai thich vi sao cac trang dang load cham/khong vao duoc va dua checklist sua cho Agent Opus 4.6.  
Pham vi: chi dieu tra va bao cao, chua sua code.

## Tom tat ngan gon

Co 3 nhom nguyen nhan chinh:

1. **Blocker auth**: login hien dang fail, lam cac trang dashboard redirect ve `/login` thay vi render noi dung that.
2. **Nghen DB pool**: Prisma/PG pool dang cau hinh `max: 1`, nen cac query duoc viet `Promise.all` van bi xep hang qua 1 connection.
3. **Server-render fetch qua rong**: nhieu trang fetch full bang va join/filter bang JavaScript trong server render, thay vi dung DB relation/aggregate/pagination.

Uu tien sua:

1. Sua login/signin doc duoc `users.password` theo duong noi bo an toan.
2. Dieu chinh DB pool theo moi truong.
3. Toi uu cac data action cua dashboard/reports/module list.
4. Do lai TTFB authenticated sau moi buoc.

## Evidence da do/kiem tra

### 1. Dev server start duoc

Lenh dung khi dieu tra:

```powershell
npm run dev
```

Output tom tat:

```text
Next.js 16.1.6 (Turbopack)
Local: http://localhost:3000
Ready in 1476ms
```

### 2. Login API fail du user ton tai trong DB

Request:

```powershell
POST http://localhost:3000/api/auth/signin
body: {"email":"hang@vtn.vn","password":"password123"}
```

Ket qua:

```json
{"ok":false,"error":"Email không tồn tại"}
```

HTTP status: `401`.

Trong khi query DB truc tiep bang `pg` xac nhan:

- `hang@vtn.vn` ton tai.
- `pm@vtn.vn` ton tai.
- `admin@vtn.vn` ton tai.
- Tat ca co `password` hash prefix `$2b$10$`.
- `bcrypt.compare('password123', hash)` tra `true`.

Bang user DB rut gon:

| Email | Role | Active | Password dung `password123` |
|---|---|---:|---:|
| `hang@vtn.vn` | `DIRECTOR` | true | true |
| `pm@vtn.vn` | `PROJECT_MANAGER` | true | true |
| `admin@vtn.vn` | `ADMIN` | true | true |

### 3. Trang dashboard redirect 307, chua do duoc page content that

Do vi login fail/session khong hop le, cac request page bang cookie khong vao duoc noi dung that:

```text
/dashboard           status=307
/crm                 status=307
/sale                status=307
/projects            status=307
/finance/invoices    status=307
/employees           status=307
/reports             status=307
/payroll             status=307
/settings            status=307
/timesheets          status=307
```

Dieu nay nghia la cam giac "load cham" co the dang gom ca vong redirect/login fail, khong chi la render cham.

### 4. Benchmark DB pool cho thay nghen connection

Benchmark truc tiep bang `pg`:

```text
pool max=1: 6 parallel 120ms queries => 1105ms
pool max=6: 6 parallel 120ms queries => 274ms
```

Y nghia: cac page dang dung `Promise.all` nhung vi pool chi co 1 connection, nhieu query van chay gan nhu tuan tu.

## P0 - Blocker can sua truoc

### P0-01 - Login fail vi `serverSupabase` deny-list cot `password` ke ca cho signin

Muc do: `P0`  
Anh huong: khong login duoc, moi dashboard page redirect ve `/login`, khong do duoc page load that.

File lien quan:

- `src/app/api/auth/signin/route.ts`
- `src/lib/server-supabase.ts`

Bang chung:

`src/app/api/auth/signin/route.ts:16-20`:

```ts
const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password, name, role, isActive')
    .eq('email', email as string)
    .single()
```

`src/app/api/auth/signin/route.ts:22`:

```ts
if (error || !user || !user.password) {
    return NextResponse.json({ ok: false, error: 'Email không tồn tại' }, { status: 401 })
}
```

`src/lib/server-supabase.ts:106-109`:

```ts
const SENSITIVE_COLUMNS: Record<string, string[]> = {
    users: ['password'],
}
```

`src/lib/server-supabase.ts:153-161`:

```ts
if (cols) {
    const proj: Record<string, true> = {}
    for (const col of cols) {
        if (!denyList.includes(col)) {
            proj[col] = true
        }
    }
    return Object.keys(proj).length > 0 ? proj : undefined
}
```

Root cause:

- Signin route can doc password de `bcrypt.compare`.
- Nhung adapter `serverSupabase` tu dong loai `password` khoi projection.
- Ket qua: user co the ton tai, nhung `user.password` bi undefined.
- Signin route tra loi sai la "Email không tồn tại".

De xuat fix cho Opus:

- Khong dung `supabase` wrapper chung cho auth password lookup.
- Tao helper rieng, vi du `getUserForPasswordLogin(email)` trong server-only auth module, dung Prisma/PG truc tiep va chi select cac cot can cho login.
- Giu deny-list password cho moi query user-facing khac.
- Neu van muon dung `serverSupabase`, them API noi bo co chu y ro rang, vi du `.selectUnsafeForAuth(...)`, nhung cach helper rieng an toan hon.

Acceptance criteria:

- `POST /api/auth/signin` voi `hang@vtn.vn/password123` tra `200` va set cookie `vtn-session`.
- `GET /api/auth/me` sau login tra user hop le.
- `getUsers()`, `globalSearch()`, reports/payroll user lookup khong bao gio tra `password`.
- Them regression test: signin can password, user list khong leak password.

## P1 - Nghen hieu nang server/database

### P1-01 - Prisma PG pool `max: 1` lam `Promise.all` mat tac dung

Muc do: `P1`  
Anh huong: moi page server-render co nhieu DB query deu co nguy co TTFB cao.

File lien quan:

- `src/lib/prisma.ts`

Bang chung:

`src/lib/prisma.ts:13-18`:

```ts
const pool = new Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
})
```

Benchmark:

```text
pool max=1: 6 parallel 120ms queries => 1105ms
pool max=6: 6 parallel 120ms queries => 274ms
```

Root cause:

- Next server render goi nhieu data function song song.
- Prisma adapter dung chung pool `max=1`.
- DB query bi serialize qua 1 connection, tao hang doi.

De xuat fix cho Opus:

- Cau hinh pool theo moi truong:
  - Local/dev hoặc serverful: `max` 5-10.
  - Serverless: dung pooler phu hop hoac bien env rieng `DB_POOL_MAX`.
- Vi du:

```ts
const poolMax = Number(process.env.DB_POOL_MAX ?? (process.env.NODE_ENV === 'production' ? 3 : 10))
```

- Can can nhac Supabase connection limit; khong hardcode so lon trong production neu deploy serverless scale ngang.

Acceptance criteria:

- Benchmark parallel DB query giam ro ret.
- Authenticated `/dashboard` TTFB warm < 1s voi data demo hien tai.
- Khong tang qua gioi han connection cua Supabase.

### P1-02 - Dashboard dung `Promise.all` nhung moi data function lai fan-out them DB query

Muc do: `P1`

File lien quan:

- `src/app/(dashboard)/dashboard/page.tsx`
- `src/lib/actions/dashboard.ts`

Bang chung:

`src/app/(dashboard)/dashboard/page.tsx:72-77`:

```ts
const [kpisResult, projectsResult, leadsResult, chartResult] = await Promise.all([
    getDashboardKPIs(),
    canViewProjects ? getRecentProjects() : Promise.resolve(...),
    canViewCrm ? getRecentLeads() : Promise.resolve(...),
    (canViewFinance || canViewProjects) ? getChartData() : Promise.resolve(...),
])
```

`src/lib/actions/dashboard.ts:18-24` goi 5 query song song cho KPI.

`src/lib/actions/dashboard.ts:106-118` chart data lai fetch `payments` va `projects`.

Tong hop:

- Dashboard co the tao 9 query DB cho mot render.
- Voi pool `max=1`, cac query nay bi xep hang.
- `unstable_cache` co revalidate, nhung first load/cache miss van cham; neu auth bug lam redirect thi chua thay duoc content.

De xuat fix cho Opus:

- Sau khi sua pool, tiep tuc giam query count:
  - Dung DB aggregate/count thay vi select list roi reduce.
  - Gom KPI vao mot RPC/view SQL neu dashboard la critical page.
  - Cache dashboard data theo role neu du lieu khong user-specific.

Acceptance criteria:

- Log query count cho `/dashboard` giam.
- Cold render va warm render duoc do rieng.

## P2 - Data fetching qua rong tren cac trang module

### P2-01 - Reports page fan-out 5 module action nang

Muc do: `P2`

File lien quan:

- `src/app/(dashboard)/reports/page.tsx`

Bang chung:

`src/app/(dashboard)/reports/page.tsx:23-29`:

```ts
const [projects, invoices, employees, stages, payrollPeriods] = await Promise.all([
    getProjects(),
    getInvoices(),
    getEmployees(),
    getLeadsByStage(),
    getPayrollPeriods(),
])
```

Cac action con:

- `getProjects()` lay `projects`, `project_phases`, `users`.
- `getInvoices()` lay `invoices`, `projects`.
- `getEmployees()` lay `employees`, `users`, `timesheets`.
- `getLeadsByStage()` lay `crm_stages`, `crm_leads`.
- `getPayrollPeriods()` lay payroll periods.

Root cause:

- Reports la trang tong hop nhung dang goi lai action list cua tung module.
- Nhieu action fetch full table va join/filter trong JS.
- Voi pool `max=1`, report co the thanh trang cham nhat.

De xuat fix cho Opus:

- Tao action rieng cho Reports, chi query dung aggregate/report data can hien thi.
- Dung SQL aggregate: count projects, sum invoices, count leads by source/stage, employee utilization aggregate.
- Khong goi action UI-list cua tung module cho report.

Acceptance criteria:

- `/reports` khong fetch full rows neu chi can KPI/chart aggregate.
- So query va payload bytes giam ro ret.

### P2-02 - `getEmployees()` fetch full tables va join/filter trong JS

Muc do: `P2`

File lien quan:

- `src/lib/actions/employees.ts`

Bang chung:

`src/lib/actions/employees.ts:14-24`:

```ts
const { data: employees } = await supabase.from('employees').select('*')
const { data: users } = await supabase.from('users').select('id, name, email, role')
const { data: timesheets } = await supabase.from('timesheets').select('employeeId, hours')

return (employees || []).map((emp) => {
    const user = (users || []).find((u) => u.id === emp.userId) || ...
    const empTimesheets = (timesheets || []).filter((t) => t.employeeId === emp.id)
    return { ...emp, user, timesheets: empTimesheets }
})
```

Rui ro:

- Khi timesheets tang, moi employees page/reports page se keo toan bo timesheets.
- Join/filter O(n*m) trong JS.

De xuat fix cho Opus:

- Neu employees page chi can tong gio, query aggregate theo `employeeId`.
- Neu can chi tiet timesheets, lazy-load theo employee/detail page.
- Dung relation query/select toi thieu field.

Acceptance criteria:

- Employees list khong fetch full timesheets.
- Reports utilization dung aggregate.

### P2-03 - `getProjects()` fetch full projects/phases/users roi join trong JS

Muc do: `P2`

File lien quan:

- `src/lib/actions/projects.ts`

Bang chung:

`src/lib/actions/projects.ts:12-26`:

```ts
const { data: projects } = await supabase.from('projects').select('*').order(...)
const { data: phases } = await supabase.from('project_phases').select('id, projectId, state')
const { data: users } = await supabase.from('users').select('id, name')

return (projects || []).map((p) => ({
    ...p,
    phases: (phases || []).filter((ph) => ph.projectId === p.id),
    manager: (users || []).find((u) => u.id === p.managerId) || null,
}))
```

De xuat fix cho Opus:

- Dung relation include/select hoac query phases aggregate grouped by project.
- Them pagination cho projects list.
- Chi select cot can render card/table.

Acceptance criteria:

- Projects list co limit/page.
- Payload khong gom full project rows neu UI chi can summary.

### P2-04 - `getLeadsByStage()` fetch all leads/stages roi filter trong JS

Muc do: `P2`

File lien quan:

- `src/lib/actions/crm.ts`

Bang chung:

`src/lib/actions/crm.ts:24-32`:

```ts
const { data: stages } = await supabase.from('crm_stages').select('*').order('sequence')
const { data: leads } = await supabase.from('crm_leads').select('*')

return (stages || []).map((stage) => ({
    ...stage,
    leads: (leads || []).filter((l) => l.stageId === stage.id),
}))
```

Rui ro:

- CRM Kanban se cham khi lead tang.
- Reports cung goi action nay de tinh conversion/source.

De xuat fix cho Opus:

- CRM page: fetch leads theo page/stage hoac column virtualization.
- Reports: dung aggregate query rieng, khong lay full lead objects.

Acceptance criteria:

- CRM page khong tai toan bo leads neu du lieu lon.
- Reports source/conversion tinh bang aggregate.

### P2-05 - Sale page fetch quotations va contracts rieng, contract lai query milestones toan bo

Muc do: `P2`

File lien quan:

- `src/app/(dashboard)/sale/page.tsx`
- `src/lib/actions/sale.ts`

Bang chung:

`src/app/(dashboard)/sale/page.tsx:12`:

```ts
const [quotations, contracts] = await Promise.all([getQuotations(), getContracts()])
```

`src/lib/actions/sale.ts:59-67`: `getQuotations()` fetch all quotation rows.

`src/lib/actions/sale.ts:71-86`: `getContracts()` fetch all contract rows, sau do fetch `sale_milestones` voi chi `orderId` nhung khong filter theo contract IDs.

De xuat fix cho Opus:

- Them pagination/search cho sale orders.
- Count milestones grouped by `orderId` voi filter order IDs hoac DB aggregate.
- Chi select cot can cho list.

Acceptance criteria:

- Sale page khong fetch all sale_orders neu data tang.
- Milestone count query co filter theo visible contract IDs.

### P2-06 - Timesheets page goi `getProjects()` nang chi de lay active project options

Muc do: `P2`

File lien quan:

- `src/app/(dashboard)/timesheets/page.tsx`

Bang chung:

`src/app/(dashboard)/timesheets/page.tsx:18-27`:

```ts
const [currentEmployee, allProjects] = await Promise.all([
    getCurrentEmployee(),
    getProjects(),
])
const timesheets = currentEmployeeId ? await getTimesheets(...) : []
```

`src/app/(dashboard)/timesheets/page.tsx:36-38` chi can:

```ts
const activeProjects = allProjects
    .filter(p => p.state === 'ACTIVE' || p.state === 'DRAFT')
    .map(p => ({ id: p.id, name: p.name, code: p.code }))
```

Root cause:

- Timesheet page chi can project options nho, nhung goi `getProjects()` nang, keo phases/users.

De xuat fix cho Opus:

- Tao action `getActiveProjectOptions()` chi select `id,name,code,state` voi filter state.
- Chay currentEmployee, project options, timesheet week query voi thu tu toi uu sau khi biet employee.

Acceptance criteria:

- Timesheet page khong goi `getProjects()`.

## P3 - Van de do dac va tooling

### P3-01 - GitNexus CLI refresh duoc nhung MCP query van loi KuzuDB path

Bang chung:

`npx gitnexus analyze` output:

```text
Repository indexed successfully
1,253 nodes | 2,935 edges | 53 clusters | 94 flows
```

Nhung `mcp__gitnexus__.query` tra:

```text
KuzuDB not found at ...\.gitnexus\kuzu. Run: gitnexus analyze
```

Rui ro:

- Khong dung duoc graph query de trace call chain performance trong lan dieu tra nay.
- Bao cao nay dua tren static file reads + runtime command evidence.

De xuat:

- Kiem tra GitNexus CLI/MCP registry path.
- Dam bao MCP doc dung index moi.

## Ke hoach sua de giao Opus 4.6

### Buoc 1 - Sua auth blocker

Files:

- `src/app/api/auth/signin/route.ts`
- `src/lib/server-supabase.ts`
- co the them `src/lib/auth-user-lookup.ts` hoac helper tuong duong.

Viec can lam:

- Tao query noi bo lay password hash cho signin.
- Khong expose `password` qua user-facing select.
- Them test cho signin path va deny-list path.

Verify:

```powershell
npm test
npm run build
```

Manual verify:

```powershell
POST /api/auth/signin hang@vtn.vn/password123 => 200
GET /api/auth/me => user DIRECTOR
GET /dashboard => 200, khong redirect
```

### Buoc 2 - Sua DB pool config

Files:

- `src/lib/prisma.ts`
- `.env.example` neu them `DB_POOL_MAX`

Viec can lam:

- Them env `DB_POOL_MAX`.
- Default dev cao hon 1, production tuy deployment.
- Ghi chu Supabase connection limit.

Verify:

- Benchmark song song query truoc/sau.
- Theo doi connection errors.

### Buoc 3 - Toi uu cac action nang

Files uu tien:

- `src/lib/actions/dashboard.ts`
- `src/app/(dashboard)/reports/page.tsx`
- `src/lib/actions/employees.ts`
- `src/lib/actions/projects.ts`
- `src/lib/actions/crm.ts`
- `src/lib/actions/sale.ts`
- `src/app/(dashboard)/timesheets/page.tsx`

Viec can lam:

- Tao action rieng cho report aggregates.
- Them project options action cho timesheets.
- Select cot toi thieu.
- Pagination cho list pages.
- Dung aggregate/group by trong DB thay vi full-table fetch + JS filter.

### Buoc 4 - Do lai

Sau khi fix auth, do lai TTFB authenticated:

```powershell
/dashboard
/crm
/sale
/projects
/finance/invoices
/employees
/reports
/payroll
/settings
/timesheets
```

Target ban dau:

- Warm TTFB trang dashboard/list: < 1000ms voi demo data.
- Reports: < 1500ms voi demo data.
- Khong co redirect 307 ngoai y muon.

## Ghi chu ve trang thai workspace

Trong lan dieu tra truoc khi lap bao cao:

- Dev server local da duoc bat de test va da tat.
- Session tam trong `app_sessions` da duoc xoa.
- `AGENTS.md`/`CLAUDE.md` bi GitNexus auto-update khi analyze va da duoc restore.
- Khong sua code ung dung.
