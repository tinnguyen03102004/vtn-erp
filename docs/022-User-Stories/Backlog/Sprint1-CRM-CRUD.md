# User Stories — Sprint 1: CRM CRUD

> Epic 1 | 5 stories | ~5 server actions

---

## E1-S1: Tạo Lead Mới

**As a** PM/Sales  
**I want to** tạo lead mới từ Kanban board  
**So that** tôi quản lý được cơ hội kinh doanh mới

### Acceptance Criteria

- [ ] Button "Tạo lead" trên trang CRM mở modal form
- [ ] Fields: tên lead*, khách hàng*, email, SĐT, nguồn, giá trị, ghi chú
- [ ] Lead tạo ở stage đầu tiên (Mới) với probability tương ứng
- [ ] Sau khi tạo → toast "Đã tạo lead" + refresh Kanban
- [ ] Validation: tên lead + khách hàng bắt buộc

### Technical Notes

- Action: `createLead(data)` → `supabase.from('crm_leads').insert()`
- UI: Modal form (client component) trên CRM page

---

## E1-S2: Sửa Lead

**As a** PM/Sales  
**I want to** sửa thông tin lead  
**So that** tôi cập nhật được thông tin mới nhất

### Acceptance Criteria

- [ ] Button "Sửa" trên lead detail page mở form edit
- [ ] Pre-fill tất cả fields hiện tại
- [ ] Sau khi save → toast "Đã cập nhật" + refresh data
- [ ] Validation tương tự tạo mới

### Technical Notes

- Action: `updateLead(id, data)` → `supabase.from('crm_leads').update().eq('id', id)`

---

## E1-S3: Xóa Lead

**As a** PM/Sales  
**I want to** xóa lead không còn tiềm năng  
**So that** Kanban board sạch sẽ

### Acceptance Criteria

- [ ] Button "Xóa" trên lead detail page
- [ ] Confirm dialog: "Xóa lead [tên]? Hành động này không thể hoàn tác"
- [ ] Sau khi xóa → redirect /crm + toast "Đã xóa lead"
- [ ] Hard delete (không soft delete vì không cần audit trail ở phase 1)

### Technical Notes

- Action: `deleteLead(id)` → `supabase.from('crm_leads').delete().eq('id', id)`

---

## E1-S4: Kéo Lead Sang Stage (Kanban)

**As a** PM/Sales  
**I want to** kéo lead sang stage mới trên Kanban  
**So that** tôi tracking pipeline chính xác

### Acceptance Criteria

- [ ] Drag-drop lead card giữa các cột Kanban
- [ ] Sau khi drop → update stageId + probability tự động theo stage
- [ ] Optimistic UI update (di chuyển ngay, save background)
- [ ] Toast "Đã chuyển [lead] sang [stage]"

### Technical Notes

- Action: `moveLeadStage(id, stageId)` → update `stageId` + `probability` from `crm_stages`
- UI: Sử dụng HTML5 drag & drop API (không cần thư viện ngoài)

---

## E1-S5: Chuyển Lead → Báo giá

**As a** PM/Sales  
**I want to** chuyển lead thành công thành báo giá  
**So that** tôi bắt đầu quá trình bán hàng chính thức

### Acceptance Criteria

- [ ] Button "Chuyển sang Báo giá →" trên lead detail
- [ ] Tự động tạo Sale Order với: partnerName, partnerEmail, partnerPhone, leadId từ lead
- [ ] Redirect đến trang báo giá mới tạo (`/sale/[id]`)
- [ ] Toast "Đã tạo báo giá từ lead [tên]"

### Technical Notes

- Action: `convertLeadToOrder(leadId)` → insert `sale_orders` with `leadId` FK
- Flow: createOrder → redirect `/sale/${newOrder.id}`
