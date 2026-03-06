# VTN-ERP Roadmap

> Kiến trúc sư ERP cho team VTN Architects (~30 người)
> **Chiến lược**: Hoàn thiện → UX Polish → AI-First Integration

---

## Phase 1: Hoàn thiện CRUD ✅ DONE

> Mọi module CRUD đầy đủ, team có thể dùng thực tế

### 1.1 CRM Module ✅

- [x] Edit/Delete Lead — inline edit trên detail page
- [x] Chuyển stage trên Kanban (drag-drop persist)
- [x] Lead → Báo giá — flow chuyển đổi

### 1.2 Sale Module ✅

- [x] Edit Sale Order — sửa lines/milestones inline
- [x] State transitions — DRAFT → SENT → SALE → DONE → CANCEL
- [x] Tạo Project từ Sale Order — auto-generate project + phases

### 1.3 Projects ✅

- [x] CRUD Phases — thêm/xóa giai đoạn, chuyển state
- [x] CRUD Tasks — quản lý tasks, assign, checkbox
- [x] State management — DRAFT → ACTIVE → PAUSED → DONE

### 1.4 Finance ✅

- [x] Tạo Invoice — từ milestone / project
- [x] Ghi nhận Payment — auto-mark PAID khi đủ
- [x] State transitions — DRAFT → POSTED → PAID

### 1.5 Settings ✅

- [x] Persist settings — lưu thông tin công ty vào DB

---

## Phase 2: UX Polish & Hoàn thiện ✅ DONE

> Team dùng hàng ngày — đủ tính năng quản lý + UX mượt

### 2.1 HR & Timesheets ✅

- [x] CRUD Employee — thêm/sửa nhân viên + tạo user tương ứng
- [x] Tạo/sửa Timesheet entries — lưu DB, date range filter

### 2.2 User & RBAC ✅

- [x] User management — thêm/sửa/khóa users
- [x] RBAC enforcement — 14 permissions × 5 roles

### 2.3 UX Improvements ✅

- [x] Global search — ⌘K tìm kiếm across 5 modules
- [x] Responsive mobile — 3 breakpoints (1024/768/480px)
- [x] Dashboard charts — doanh thu + trạng thái dự án (real data)
- [x] Keyboard shortcuts — Ctrl+K, arrow nav, Enter/Escape

### 2.4 Data Quality ✅

- [x] Form validation — 7 validator functions + FieldError component
- [x] Export PDF invoices — styled HTML invoice + print dialog

---

## Phase 3: AI-First Integration 🤖

> Mục tiêu: Chat thay form — nhập liệu bằng ngôn ngữ tự nhiên

### 3.1 AI Chat Interface

- [ ] Chat widget — sidebar/overlay trên mọi page
- [ ] Function Calling — AI hiểu intent → gọi backend actions
- [ ] Confirmation flow — AI đề xuất → user xác nhận → thực thi

### 3.2 Supported Actions

- "Tạo lead mới cho Ông Nguyễn Văn A, biệt thự Q7, 2 tỷ"
- "Log 8 giờ ngày hôm nay cho dự án Grand Residence"
- "Tạo invoice milestone 2 cho SO-2026-005"

### 3.3 Smart Features

- [ ] Context-aware — nhận biết page đang xem
- [ ] Data lookup — "tổng doanh thu tháng này"
- [ ] Bulk actions — "log timesheet cả tuần"

---

## Milestones

| Milestone | Phase | Status | Deliverable |
|---|---|---|---|
| **M1** | 1.1-1.3 | ✅ | CRM + Sale + Projects CRUD |
| **M2** | 1.4-1.5 | ✅ | Finance + Settings |
| **M3** | 2.1-2.2 | ✅ | HR + RBAC |
| **M4** | 2.3-2.4 | ✅ | UX polish, search, PDF export |
| **M5** | 3.1-3.3 | **NEXT** | AI-First ERP |
