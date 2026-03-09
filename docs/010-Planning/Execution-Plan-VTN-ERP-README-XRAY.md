---
id: PLAN-001
type: plan
status: draft
created: 2026-03-09
updated: 2026-03-09
tags: [planning, execution, onboarding, architecture, ai, quality]
linked-to: [[README]], [[PROJECT_XRAY]], [[SDD-VTN-ERP]], [[PRD-VTN-ERP-Phase1]], [[PRD-VTN-ERP-Phase2]]
---

# Goal

Tạo một kế hoạch thực thi ngắn gọn nhưng đủ chặt để đưa VTN-ERP từ trạng thái "đã có luồng nghiệp vụ thật, nhưng tài liệu và chất lượng kỹ thuật còn lệch nhau" sang trạng thái "kiến trúc khóa lại, core flows được harden, quality gates rõ ràng, và roadmap AI/UX mở rộng có thể triển khai mà không đoán". Kế hoạch này lấy `README.md` và `PROJECT_XRAY.md` hiện tại làm baseline mới, đồng thời dùng `SDD` và `PRD` cũ như tài liệu cần được đồng bộ lại chứ không coi là source of truth tuyệt đối.

# Constraints

- Phải bám theo runtime hiện tại trong `README.md` và `PROJECT_XRAY.md`, không quay lại giả định cũ về mock data hoặc NextAuth nếu codebase đã chuyển tiếp.
- Giữ scope là **internal tool cho một công ty kiến trúc single-tenant**, không mở sang multi-tenant hay generic ERP.
- Không thay đổi business flow lõi: `Lead -> Báo giá -> Hợp đồng -> Dự án -> Hóa đơn -> Thanh toán -> Timesheet`.
- Ưu tiên hardening và đồng bộ tài liệu trước khi thêm tính năng AI/UX mới.
- Mọi bước phải có verification point rõ ràng; không coi “đã code xong” là hoàn thành.
- Khi tài liệu và code mâu thuẫn, cần khóa lại source of truth trước rồi mới triển khai tiếp.

# Out Of Scope

- Viết lại kiến trúc theo microservices.
- Chuyển sang Odoo hoặc hybrid Odoo backend.
- Làm mobile app native.
- Bật multi-tenant, client portal production, hoặc billing/compliance cấp doanh nghiệp lớn trong đợt này.

# Steps

1. Khóa baseline tài liệu và source of truth
   - Files or surfaces touched:
     `README.md`, `PROJECT_XRAY.md`, `docs/030-Specs/Architecture/SDD-VTN-ERP.md`, `docs/020-Requirements/PRD-VTN-ERP-Phase1.md`, `docs/020-Requirements/PRD-VTN-ERP-Phase2.md`, `prisma/schema.prisma`
   - Implementation intent:
     Đồng bộ lại mô tả kiến trúc, auth flow, AI flow, bảng dữ liệu, module map, changelog và trạng thái phase để người mới đọc docs không bị dẫn sai bởi tài liệu cũ. Chốt rõ file nào là source of truth cho runtime, schema và roadmap.
   - Verification:
     `git diff -- README.md PROJECT_XRAY.md docs/030-Specs/Architecture/SDD-VTN-ERP.md docs/020-Requirements/PRD-VTN-ERP-Phase1.md docs/020-Requirements/PRD-VTN-ERP-Phase2.md prisma/schema.prisma`
     Check thủ công: README, XRAY, SDD không còn mâu thuẫn ở 4 điểm tối thiểu: auth, data layer, số model/bảng, trạng thái AI.

2. Harden core contracts của server actions
   - Files or surfaces touched:
     `src/lib/action-result.ts`, `src/lib/schemas.ts`, `src/lib/types.ts`, `src/lib/actions/*.ts`, `src/lib/validation.tsx`
   - Implementation intent:
     Chuẩn hóa input/output của server actions theo DTO + schema + ActionResult, loại bỏ phần “throw mơ hồ” ở các mutation quan trọng, và đảm bảo mọi business flow lõi có validation server-side rõ ràng. Ưu tiên các module có rủi ro cao: `crm.ts`, `sale.ts`, `finance.ts`, `projects.ts`, `attachments.ts`, `timesheets.ts`.
   - Verification:
     `npm run lint`
     `npm test`
     Check thủ công: mỗi mutation lõi trả lỗi theo format thống nhất và không phụ thuộc vào `any` cho data contract chính.

3. Đóng các lỗ hổng auth, RBAC và safety runtime
   - Files or surfaces touched:
     `src/proxy.ts`, `src/lib/session.ts`, `src/lib/auth-guard.ts`, `src/lib/rbac.ts`, `src/components/shared/Sidebar.tsx`, `src/app/(dashboard)/**`, `src/app/api/upload/route.ts`, `src/lib/actions/users.ts`
   - Implementation intent:
     Đảm bảo auth runtime, session lifecycle, route guard, server guard và UI visibility cùng nói một ngôn ngữ. Menu, page, action button và API nhạy cảm phải phản ánh đúng quyền. Ưu tiên các case dễ rò quyền: upload tài liệu, user management, finance pages, timesheet theo current user.
   - Verification:
     `npm run lint`
     Kiểm thử tay theo role:
     `DIRECTOR`, `PROJECT_MANAGER`, `ARCHITECT`, `FINANCE`, `SALES`
     Done khi:
     mỗi role chỉ thấy đúng module;
     mutation bị chặn đúng chỗ;
     session hết hạn/logout không còn truy cập được route private.

4. Thiết lập quality gates đủ mạnh trước khi mở rộng feature
   - Files or surfaces touched:
     `src/lib/__tests__/*`, `vitest.config.ts`, test folders mới cho integration/E2E nếu thêm, `.github/workflows/*` nếu dùng CI
   - Implementation intent:
     Mở rộng từ unit tests hiện có sang integration tests cho các flow sống còn: lead -> quotation, quotation -> contract, contract -> project, milestone -> invoice, invoice -> payment, auth session, upload attachments. Nếu có CI, khóa các command bắt buộc trước merge.
   - Verification:
     `npm test`
     Nếu thêm CI: xác nhận pipeline chạy qua lint + test
     Check thủ công:
     ít nhất 1 test hoặc smoke checklist cho mỗi business flow lõi nêu trên.

5. Mở rộng roadmap theo hướng AI-first nhưng có guardrails
   - Files or surfaces touched:
     `src/components/ChatPanel.tsx`, `src/app/api/ai/chat/route.ts`, `src/lib/ai/tools.ts`, `src/lib/ai/schemas.ts`, `src/lib/ai/prompts.ts`, các action được expose cho AI, `docs/010-Planning/Roadmap-VTN-ERP.md`
   - Implementation intent:
     Chỉ mở rộng AI sau khi core contracts và RBAC đã ổn. Tập trung vào 3 hướng có ROI cao theo README/XRAY: data entry bằng ngôn ngữ tự nhiên, contextual actions ngay trong module, và operator workflows như nhắc thanh toán/milestone. Mọi write-tool phải giữ confirm flow, role-awareness và audit trail.
   - Verification:
     `npm run lint`
     `npm test`
     Smoke test tay:
     - tạo lead qua AI
     - tạo quotation qua AI
     - log timesheet qua AI
     - từ chối write action khi role không đủ quyền

# Risks

- Rủi ro lớn nhất là tài liệu tiếp tục trôi khỏi code, khiến plan mất giá trị rất nhanh.
  Mitigation: bước 1 phải hoàn tất trước bất kỳ mở rộng đáng kể nào.

- Rủi ro thứ hai là schema/runtime drift giữa Prisma, Supabase tables và các action DTO.
  Mitigation: mọi thay đổi model phải update cùng lúc `schema.prisma`, `types.ts`, `schemas.ts`, và docs.

- Rủi ro thứ ba là AI mở rộng quá sớm làm tăng bề mặt ghi dữ liệu trước khi guardrails đủ mạnh.
  Mitigation: khóa thứ tự bước, không triển khai AI write scope mới trước khi hoàn tất bước 2-4.

- Rủi ro thứ tư là quality gates chỉ dừng ở unit tests và bỏ sót flow xuyên module.
  Mitigation: bước 4 phải bao phủ end-to-end business flow, không chỉ validator tests.

# Done When

- `README.md`, `PROJECT_XRAY.md`, `SDD`, và `PRD` cùng mô tả đúng hiện trạng runtime.
- Core server actions dùng contract rõ ràng, validation rõ ràng, và verification pass.
- Auth + RBAC được enforce nhất quán từ route, UI, action tới API.
- Có quality gate đủ dùng cho các flow kinh doanh chính, không chỉ lint bề mặt.
- Roadmap mở rộng AI được cập nhật lại theo baseline mới và không mâu thuẫn với quality constraints.
