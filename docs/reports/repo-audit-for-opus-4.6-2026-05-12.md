# Bao cao audit repo VTN ERP cho Agent Opus 4.6

Ngay audit: 2026-05-12  
Workspace: `C:\Users\tinnh\.gemini\antigravity\workspaces\vtn-erp`  
Branch: `main`  
Baseline: `git status --short` sach truoc khi audit  
Node/npm: Node `v24.12.0`, npm `11.6.2`

## Tom tat dieu hanh

Audit chi doc/kiem tra va chi tao file bao cao nay. Khong sua source code, migration, config, test hay snapshot.

Ket qua chinh:

- `P0`: 1 loi bao mat du lieu nghiem trong: adapter `serverSupabase` bo qua projection cua `.select(...)`, co nguy co tra ve ca cot `password` cua bang `users` vao Server Component payload/Client Component.
- `P1`: 3 loi can sua truoc khi giao Agent khac tiep tuc: unit test dang fail, lint script dang no-op, build script package dang no-op.
- `P2`: 7 rui ro dung/sai nghiep vu va bao ve du lieu: e2e mutate remote data, sai so lieu report, state update thieu enum validation, raw update/mass assignment, upload attachment chua validate ownership/entity ton tai, dashboard data thieu auth guard o action layer, AI confirmation co the bi bypass o API layer.
- `P3`: 2 no ky thuat: qua nhieu `any`/eslint-disable va GitNexus MCP chua doc duoc DB sau khi refresh CLI.

Bang lenh kiem chung:

| Lenh | Ket qua | Ghi chu |
|---|---:|---|
| `npx gitnexus analyze .` | Pass sau khi cap quyen | Index CLI: `1,206 nodes`, `2,865 edges`, `49 clusters`, `90 flows`. |
| `npm run typecheck` | Pass | `8 successful, 8 total`. Chi chay packages. |
| `npm run lint` | Exit 0 nhung no-op | Turbo bao `No tasks were executed`. |
| `npm test` | Fail | 205 tests pass, 1 suite fail: `src/lib/__tests__/session.test.ts`. |
| `npm run build` | Pass sau khi cap quyen | Next build pass, nhung package build no-op. |
| `npm run test:e2e` | Khong chay | Bi chan vi e2e dang login vao Supabase that va tao du lieu nghiep vu. |

## P0 - Loi bao mat/data blocker

### P0-01 - `serverSupabase` bo qua `.select(...)`, co nguy co leak password hash

Muc do: `P0`  
Pham vi: data access, user management, reports, payroll, search, session

Bang chung:

- `src/lib/server-supabase.ts:123` nhan tham so `_columns?: string` nhung khong parse/luu danh sach cot.
- `src/lib/server-supabase.ts:233-248` khi select chi goi `delegate.findFirst/findMany({ where, orderBy, take })`, khong co `select`.
- `prisma/schema.prisma:16-24` model `User` co cot `password`.
- `src/lib/actions/users.ts:12` goi `.select('id, name, email, role, isActive, createdAt')`, nhung adapter server khong ton trong projection.
- `src/app/(dashboard)/settings/page.tsx:15-17` truyen `users` vao `SettingsContent`, sau do `UserManagement` la Client Component o `src/components/UserManagement.tsx:1-18`.
- Cac noi khac cung select user subset nhung se nhan full row tren server: `src/lib/actions/search.ts:24`, `src/lib/actions/employees.ts:17,33`, `src/lib/actions/payroll.ts:41,100`, `src/app/api/reports/export/route.ts:35`.

Trieu chung/rui ro:

- Hash mat khau co the bi serialize vao RSC payload hoac client state neu ket qua server action/page props di vao Client Component.
- Cac API/report co the vo tinh giu/tra ve truong nhay cam neu code sau nay stringify full object.
- Loi nay khong bi `typecheck` bat vi `supabase` bi cast ve type browser client o `src/lib/supabase.ts:10-12`.

De xuat fix cho Opus:

- Sua `ServerQueryBuilder.select(columns)` de parse projection string thanh Prisma `select`.
- Mac dinh deny-list cac cot nhay cam (`password`, token/session secret fields) khi table la `users`, tru khi query duoc danh dau noi bo va thuc su can password cho login.
- Tach path auth login rieng: signin duoc phep doc `password`, cac query con lai khong bao gio tra cot nay.
- Them test cho `getUsers`, `globalSearch`, payroll/report user lookup de assert ket qua khong co `password`.

Acceptance criteria:

- `getUsers()` va cac action/report user lookup khong tra `password` trong data runtime.
- `npm test` co test moi fail truoc fix va pass sau fix.
- Audit grep khong con pattern user-facing `.select(...)` bi adapter bo qua projection.

## P1 - Can sua truoc khi tiep tuc phat trien

### P1-01 - Unit test fail vi `server-only` bi import trong Vitest

Muc do: `P1`

Bang chung:

- `npm test` fail:
  - `Test Files 1 failed | 11 passed`
  - `Tests 205 passed`
  - Failed suite: `src/lib/__tests__/session.test.ts`
  - Error: `This module cannot be imported from a Client Component module. It should only be used from a Server Component.`
- `src/lib/session.ts:1` import `server-only`.
- `src/lib/__tests__/session.test.ts:15` import `verifySignature` tu `@/lib/session`.

Trieu chung/rui ro:

- Test suite khong xanh, nen moi sua doi tiep theo khong co baseline tin cay.
- Test dang muon kiem pure crypto (`verifySignature`) nhung bi keo ca module server-only/cookies.

De xuat fix cho Opus:

- Tach ham pure crypto (`signToken`, `verifyAndExtractToken`, `verifySignature`) sang module server-safe/test-safe khong import `server-only`, vi du `src/lib/session-crypto.ts`.
- Giu `server-only` trong module co `cookies()`/DB access.
- Cap nhat test import module crypto moi, hoac mock `server-only` trong Vitest neu muon giu kien truc hien tai.

Acceptance criteria:

- `npm test` pass 100%.
- Test moi/doi khang van cover malformed cookie, tampered signature, multiple colon.

### P1-02 - `npm run lint` exit 0 nhung khong lint file nao

Muc do: `P1`

Bang chung:

- `package.json:14`: `"lint": "turbo run lint"`.
- Output `npm run lint`: `Tasks: 0 successful, 0 total` va warning `No tasks were executed as part of this run`.
- Cac package `package.json` chi co `build`/`typecheck`, gan nhu khong co script `lint`.

Trieu chung/rui ro:

- CI/local co the bao xanh gia trong khi ESLint khong chay.
- 94 dong disable `@typescript-eslint/no-explicit-any` va 115 pattern `as any/: any/Record<string, any>` khong bi gate nao canh bao.

De xuat fix cho Opus:

- Doi root lint script thanh lenh that su chay ESLint tren `src`, `packages`, `e2e`, `scripts`, vi du `eslint .`.
- Hoac them `lint` script vao tung package va giu Turbo.
- Them lint rule/gate cho `no-explicit-any` o muc warning/error theo tung thu muc.

Acceptance criteria:

- `npm run lint` output co file/task thuc su duoc lint.
- CI fail neu co loi lint.

### P1-03 - `npm run build` khong build packages vi filter Turbo sai/no-op

Muc do: `P1`

Bang chung:

- `package.json:12`: `"build": "turbo run build --filter='./packages/*' && next build"`.
- Output build: `Packages in scope:` trong, `Running build in 0 packages`, `No tasks were executed`.
- Sau do `next build` pass, nhung package `build` scripts khong duoc chay.

Trieu chung/rui ro:

- Package compile errors co the bi bo sot neu Next app khong import duong code do.
- Root build xanh nhung khong dam bao workspace packages build duoc.

De xuat fix cho Opus:

- Sua Turbo filter dung workspace package names hoac bo filter: `turbo run build --filter=@vtn/*` / `turbo run build`.
- Neu package chi can typecheck, doi ten script va CI gate ro rang.

Acceptance criteria:

- `npm run build` hien packages trong scope va chay build cua `@vtn/audit`, `@vtn/auth`, `@vtn/database`, `@vtn/errors`, `@vtn/logger`, `@vtn/schemas`, `@vtn/shared`, `@vtn/vietnam`.

## P2 - Rui ro correctness, data integrity, UX/runtime

### P2-01 - E2E khong an toan de chay tren project Supabase that, va fixture login lech demo account

Muc do: `P2`

Bang chung:

- `playwright.config.ts` start `npm run dev` va baseURL local.
- `e2e/fixtures.ts:7-12`, `e2e/auth.spec.ts:23-24`, `e2e/crm.spec.ts:5-6`, `e2e/navigation.spec.ts:5-6` dang login bang `director@vtn.vn/password123`.
- AGENTS/demo account hien tai la `hang@vtn.vn/password123` cho DIRECTOR.
- `e2e/sale.spec.ts:68-92` tao quotation moi voi ten `E2E Test Customer ${Date.now()}`.
- Yeu cau audit la khong mutate; chay e2e se co nguy co ghi du lieu vao Supabase remote.

De xuat fix cho Opus:

- Tao local/test Supabase project hoac seed database rieng cho e2e.
- Cap nhat fixture dung demo account hien tai, hoac seed lai `director@vtn.vn` trong moi truong test.
- Gan tag/guard cho test destructive; khong cho chay tren project production/demo shared.

Acceptance criteria:

- `npm run test:e2e` chay tren database test isolated.
- Sau e2e co cleanup hoac transaction rollback/fixture reset.

### P2-02 - Bao cao CSV tinh `phaseCount` sai

Muc do: `P2`

Bang chung:

- `src/app/api/reports/export/route.ts:30-38` fetch projects, invoices, payments, employees, users, tasks, timesheets; khong fetch `project_phases`.
- `src/app/api/reports/export/route.ts:53`: `const phaseCount = (projects || [].length) // simplified`.
- Bieu thuc nay gan `phaseCount` bang array `projects` neu co data, khong phai so phase.

Trieu chung/rui ro:

- CSV cot `So giai doan` co the bi sai/serialize thanh object/array string.
- Bao cao tong hop gui lanh dao se sai so lieu.

De xuat fix cho Opus:

- Fetch `project_phases` rieng va dem `ph.projectId === p.id`.
- Them unit test cho export logic hoac tach ham build CSV de test input/output.

Acceptance criteria:

- Mot project co 2 phases xuat CSV cot `So giai doan` = `2`.

### P2-03 - Cap nhat state nhan string tuy y, thieu enum/state-machine validation

Muc do: `P2`

Bang chung:

- `src/lib/actions/projects.ts:53-57`: `updateProjectState(id, state: string)` update thang vao DB.
- `src/lib/actions/finance.ts:73-77`: `updateInvoiceState(id, state: string)` update thang vao DB.
- `packages/schemas/src/index.ts:48-55`: `milestoneSchema.state` la `z.string().optional()`.
- `src/lib/actions/sale.ts:427-450`: `saveMilestones` ghi `m.state || 'PENDING'`.

Trieu chung/rui ro:

- Client hoac AI tool co the gui state khong hop le.
- DB enum/constraint neu co se tra loi o runtime; neu khong co constraint thi du lieu bi drift.

De xuat fix cho Opus:

- Tao Zod enum cho `ProjectState`, `InvoiceState`, `MilestoneState`, `SaleOrderState`.
- Dinh nghia transition matrix cho state quan trong thay vi update string tuy y.
- Them test invalid state bi reject.

Acceptance criteria:

- Invalid state khong ghi DB va tra `ActionResult.fail`.
- Valid transition co audit log nhu cu.

### P2-04 - `updatePhase` va `updateTask` nhan raw `formData`, co nguy co mass assignment

Muc do: `P2`

Bang chung:

- `src/lib/actions/projects.ts:79-81`: `updatePhase` update `formData as Record<string, unknown>` truc tiep.
- `src/lib/actions/projects.ts:112-115`: `updateTask` spread raw `formData` vao update.
- Create path co schema (`createPhaseSchema`, `createTaskSchema`), update path thi khong.

Trieu chung/rui ro:

- Client co the gui them field ngoai y muon nhu `projectId`, `createdAt`, `assigneeId`, `state`, tuy DB/Prisma chap nhan den dau.
- Kho audit/kiem soat permission theo field.

De xuat fix cho Opus:

- Them `updatePhaseSchema` va `updateTaskSchema` whitelist field duoc sua.
- Bo cac field dinh danh/ownership khoi update payload.
- Test update voi field la bi reject/strip.

Acceptance criteria:

- Raw unknown field khong duoc ghi DB.
- Update hop le van pass.

### P2-05 - Attachment upload chi check role theo entity type, chua verify entity ton tai/ownership va chua sanitize filename

Muc do: `P2`

Bang chung:

- `src/app/api/upload/route.ts:21-29` normalize entity type va check role-level `canAccessAttachmentEntity`.
- `src/app/api/upload/route.ts:49`: storage path dung `${canonicalEntityType}/${entityId}/${Date.now()}-${file.name}`.
- `src/lib/actions/attachments.ts:52-59` server action cung check permission theo entity type.
- Khong thay query verify entity `entityId` ton tai va user duoc phep attach vao record cu the.

Trieu chung/rui ro:

- User co role edit module co the upload attachment vao bat ky `entityId` cung type, ke ca record khong ton tai/khong thuoc pham vi.
- `file.name` co the chua ky tu la/path separator; Supabase Storage co the chap nhan path bat ngo.

De xuat fix cho Opus:

- Them helper `assertAttachmentEntityAccess(user, entityType, entityId, mode)` query record ton tai va record-level access.
- Sanitize filename: chi giu basename, replace path separator/control chars, gioi han length.
- Test invalid entityId, forbidden role, filename co slash/backslash.

Acceptance criteria:

- Upload vao entity khong ton tai tra 404/400.
- Upload vao entity khong co quyen tra 403.
- Storage path khong chua path segment tu filename user-controlled.

### P2-06 - Dashboard data layer khong co auth guard rieng

Muc do: `P2`

Bang chung:

- `src/app/(dashboard)/layout.tsx:7-8` guard dashboard layout.
- Nhung `src/lib/actions/dashboard.ts:15-49`, `60-73`, `85-99`, `105-143` fetch KPI/recent/chart data khong goi `requireAuth()`/`requirePermission()`.
- `src/lib/ai/tools.ts:262-265` goi `getDashboardKPIs()` tu AI tool sau khi API route chi `requireAuth()` chung.

Trieu chung/rui ro:

- Neu action/cache function bi import vao endpoint/client flow khac, data tong hop ERP khong co guard tai data layer.
- Cache key khong gan user/role, kho mo rong RBAC theo role sau nay.

De xuat fix cho Opus:

- Dua auth/permission check vao action/data function, khong chi dua vao layout.
- Neu dashboard data la global, require `dashboard.view` hoac module-level permission ro rang.
- Can nhac cache theo role/user neu data khac nhau theo RBAC.

Acceptance criteria:

- Goi dashboard data khi chua auth bi reject.
- AI tool dashboard khong tra data neu user khong co permission phu hop.

### P2-07 - AI `confirmAction` co the execute write tool tu payload client ma khong co server-side pending-action state

Muc do: `P2`

Bang chung:

- `src/app/api/ai/chat/route.ts:170-184`: neu body co `confirmAction`, route execute `executeTool(toolName, args)` ngay.
- `src/app/api/ai/chat/route.ts:255-273`: pending confirmation chi duoc tao trong response, khong thay luu server-side nonce/session state.
- `src/lib/ai/tools.ts:274-324` co write tools `create_lead`, `convert_lead_to_quotation`, `create_quotation`.

Trieu chung/rui ro:

- UI confirmation co the bi bypass bang POST truc tiep co `confirmAction`.
- Permission trong action van la hang rao chinh, nhung co che "can user confirm truoc khi write" khong duoc enforce server-side.

De xuat fix cho Opus:

- Khi tao pending action, luu nonce/action hash server-side theo session hoac signed token ngan han.
- Khi confirm, verify nonce + action hash + user/session trung khop.
- Log audit ro rang action den tu AI confirm.

Acceptance criteria:

- POST `confirmAction` khong co nonce hop le bi reject.
- Confirm dung nonce execute mot lan duy nhat.

## P3 - Cleanup/technical debt

### P3-01 - Qua nhieu `any` va eslint-disable che mat type drift

Muc do: `P3`

Bang chung:

- Static scan `src packages` tim thay 94 dong disable `@typescript-eslint/no-explicit-any`.
- Static scan tim thay 115 pattern `as any`, `: any`, `Record<string, any>`.
- Vi du: `src/lib/actions/sale.ts` co nhieu cast khi insert/update order lines/milestones; `src/components/SaleDetail.tsx`, `src/components/InvoiceDetail.tsx`, `src/app/api/ai/chat/route.ts`, PDF components cung co nhieu `any`.

De xuat fix cho Opus:

- Uu tien type-safe o data access va server actions truoc UI.
- Dung generated `Database['public']['Tables'][...]['Insert'|'Update'|'Row']`.
- Chi de `any` o boundary PDF/third-party neu co comment ly do cu the.

Acceptance criteria:

- Giam it nhat cac `any` trong server actions va API routes.
- Lint rule bat dau canh bao regression moi.

### P3-02 - GitNexus CLI refresh thanh cong nhung MCP query van khong doc duoc repo-local DB

Muc do: `P3`

Bang chung:

- `npx gitnexus analyze .` sau khi cap quyen: `Repository indexed successfully (17.3s)`, `1,206 nodes | 2,865 edges | 49 clusters | 90 flows`.
- `mcp__gitnexus__.list_repos` hien index moi tai `2026-05-12T04:31:20.511Z`.
- Nhung `mcp__gitnexus__.query` tra loi: `KuzuDB not found at ...\.gitnexus\kuzu. Run: gitnexus analyze`.

Trieu chung/rui ro:

- Graph query/impact analysis khong dung duoc trong audit nay; report phai dua vao file-level static evidence.

De xuat fix cho Opus/maintainer:

- Kiem tra GitNexus config/registry path giua CLI va MCP.
- Dam bao CLI ghi DB dung location MCP mong doi hoac cap nhat MCP repo registry.

Acceptance criteria:

- `mcp__gitnexus__.query` chay duoc voi repo `vtn-erp`.

## Phu luc - Evidence command output tom tat

### `npm run typecheck`

Pass:

- Turbo chay typecheck cho 8 package.
- `Tasks: 8 successful, 8 total`.

Luu y: typecheck root chi qua Turbo packages; Next app TypeScript duoc kiem trong `next build`.

### `npm run lint`

Exit 0 nhung khong co gia tri gate:

```text
Tasks: 0 successful, 0 total
WARNING No tasks were executed as part of this run.
```

### `npm test`

Fail:

```text
Test Files 1 failed | 11 passed (12)
Tests 205 passed (205)
FAIL src/lib/__tests__/session.test.ts
Error: This module cannot be imported from a Client Component module. It should only be used from a Server Component.
```

### `npm run build`

Pass sau khi chay ngoai sandbox vi Next/Turbopack can spawn worker:

- `Compiled successfully`
- `Generating static pages ... (23/23)`
- Route list build duoc day du.

Nhung phan package build no-op:

```text
Packages in scope:
Running build in 0 packages
WARNING No tasks were executed as part of this run.
```

### `npm run test:e2e`

Khong chay trong audit nay vi rui ro mutate data:

- Playwright suite login vao app Supabase-backed.
- `e2e/sale.spec.ts:68-92` tao quotation moi.
- Yeu cau cua audit: khong sua code va khong mutate du lieu.

## Checklist fix de giao Opus 4.6

1. Sua `serverSupabase.select`/projection va password leak truoc tien.
2. Lam xanh `npm test`.
3. Sua `npm run lint` de lint that.
4. Sua `npm run build` de build packages that.
5. Tao e2e isolated database/fixture, cap nhat demo login.
6. Sua cac loi data integrity P2: report phase count, enum state validation, project update schemas, attachment entity access, dashboard guard, AI confirm nonce.
7. Them regression tests cho tung bug P0/P1/P2 quan trong.
