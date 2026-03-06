# PRD — VTN-ERP Phase 1: Hoàn thiện CRUD

> **Product**: VTN-ERP (ERP cho công ty kiến trúc)
> **Users**: Team VTN Architects (~30 users)
> **Roles**: Giám đốc, PM, Kiến trúc sư, Kế toán

---

## 1. Business Objectives

| Objective | Metric |
|---|---|
| Team dùng được hàng ngày | 100% CRUD hoạt động, 0 mock data |
| Giảm thời gian nhập liệu | ≤3 clicks cho mỗi thao tác CRUD |
| Đảm bảo data integrity | Validation ở cả client + server |
| Role-based access | 4 roles, enforce permissions |

---

## 2. User Personas

| Persona | Role | Dùng modules |
|---|---|---|
| **Giám đốc** | ADMIN | Dashboard, Reports, tất cả |
| **PM** (Project Manager) | PM | Projects, Sale, CRM, Timesheets |
| **KTS** (Kiến trúc sư) | EMPLOYEE | Timesheets, Projects (view) |
| **Kế toán** | ACCOUNTANT | Finance, Invoices, Payments |

---

## 3. Feature Requirements (MoSCoW)

### Must Have 🔴

| # | Feature | Module | User Story |
|---|---|---|---|
| F1 | Edit/Delete Lead | CRM | PM sửa thông tin lead, xóa lead spam |
| F2 | Drag-drop persist Kanban | CRM | PM kéo lead sang stage mới, lưu vào DB |
| F3 | Lead → Báo giá flow | CRM→Sale | PM chuyển lead thành công thành báo giá |
| F4 | Edit Sale Order | Sale | PM sửa nội dung, thêm/xóa dòng dịch vụ |
| F5 | State transitions | Sale | DRAFT→SENT→SALE flow, mỗi step cần confirm |
| F6 | CRUD Phases | Projects | PM tạo/sửa/xóa giai đoạn dự án |
| F7 | CRUD Tasks | Projects | PM/KTS tạo tasks trong phase, assign người |
| F8 | Create Invoice | Finance | Kế toán tạo invoice từ milestone |
| F9 | Record Payment | Finance | Kế toán ghi nhận thanh toán, update state |
| F10 | Persist Settings | Settings | Admin lưu thông tin công ty |

### Should Have 🟡

| # | Feature | Module |
|---|---|---|
| S1 | CRUD Employee | HR |
| S2 | Timesheet approve/reject | Timesheets |
| S3 | RBAC enforcement | System |
| S4 | Toast notifications | UX |
| S5 | Search & Filter | All modules |

### Could Have 🟢

| # | Feature | Module |
|---|---|---|
| C1 | Sale → Project auto-create | Sale→Projects |
| C2 | Activity log per entity | CRM, Projects |
| C3 | Export PDF/Excel | Finance, Sale |
| C4 | File attachments | Projects, Sale |

### Won't Have (Phase 1) ⚪

| Feature | Reason |
|---|---|
| AI chat | Phase 3 |
| Mobile app | Phase 2 (responsive first) |
| Email notifications | Phase 2+ |
| Multi-tenant | Not needed (single company) |

---

## 4. Database Changes Required

```sql
-- Không cần thêm table mới
-- Các table hiện có đủ columns cho Phase 1:
-- crm_leads (13 cols), sale_orders (14), sale_order_lines (7),
-- sale_milestones (8), projects (13), project_phases (9),
-- project_tasks (12), invoices (16), payments (7),
-- employees (9), timesheets (10), users (8)
```

> Chỉ cần thêm **server actions** (create/update/delete) và **UI forms/modals**.

---

## 5. Execution Order (by dependency)

```
M1: CRM CRUD (F1, F2) → Sale CRUD (F3, F4, F5)
M2: Projects CRUD (F6, F7) → Finance CRUD (F8, F9)
M3: Settings + RBAC (F10, S3) → HR + Timesheets (S1, S2)
M4: UX polish (S4, S5) → Should/Could haves
```

---

## 6. Acceptance Criteria

- [ ] Tất cả 10 Must-Have features hoạt động end-to-end
- [ ] Không còn mock data trên bất kỳ page nào
- [ ] Mọi CRUD action có validation + error handling
- [ ] Data persist đúng trong Supabase
- [ ] Mỗi action có toast feedback
