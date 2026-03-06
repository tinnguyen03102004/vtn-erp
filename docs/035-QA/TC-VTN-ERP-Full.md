# 📋 QA TEST PLAN: VTN-ERP

> **Generated**: 2026-03-05 | **Scope**: All Tiers | **Type**: SaaS/Dashboard Hybrid
> **Protocol**: Vibecode Kit v4.0 — QA INSPECTOR

---

## Summary

| Tier | Test Cases | Category |
|------|-----------|----------|
| 🔴 Tier 1 | 24 cases | Core Functionality (Bắt buộc) |
| 🟡 Tier 2 | 18 cases | Edge Cases & Responsive |
| 🟢 Tier 3 | 12 cases | Performance, Security, A11Y |
| **Total** | **54 cases** | |

---

## 🔴 TIER 1: CORE FUNCTIONALITY (Bắt buộc)

### Authentication (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.1 | Login với email `director@vtn.vn` / `password123` | Redirect → `/dashboard`, hiển thị user name | ⬜ |
| T1.2 | Login sai password | Hiển thị error message, không redirect | ⬜ |
| T1.3 | Logout → bấm avatar → Đăng xuất | Clear session, redirect → `/login` | ⬜ |
| T1.4 | Truy cập `/dashboard` khi chưa login | Redirect → `/login` | ⬜ |

### Dashboard (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.5 | Dashboard load KPI cards | 4 KPI cards hiển thị: Dự án đang chạy, Doanh thu, Hóa đơn chờ, Nhân sự | ⬜ |
| T1.6 | Revenue chart render | Bar/Area chart hiện đúng, có tooltip khi hover | ⬜ |
| T1.7 | Recent projects table | 5 projects hiển thị với progress bar, state badge | ⬜ |
| T1.8 | Recent leads list | Leads hiển thị với stage badge, giá trị | ⬜ |

### CRM Module (3 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.9 | CRM Kanban board render | 5 columns (Leads mới → Thắng), cards trong mỗi column | ⬜ |
| T1.10 | Click lead card | Navigate → `/crm/[id]`, hiện chi tiết lead | ⬜ |
| T1.11 | Pipeline KPIs | 4 KPIs: Tổng leads, Pipeline value, Đàm phán, Đã thắng | ⬜ |

### Sale Module (3 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.12 | Sale page — order list | Bảng 5 orders với state badges (Nháp, Đã gửi, Hợp đồng) | ⬜ |
| T1.13 | Click "Tạo báo giá" | Navigate → `/sale/new`, form hiển thị | ⬜ |
| T1.14 | Click "Xem →" trên order | Navigate → `/sale/[id]`, chi tiết + milestones | ⬜ |

### Employees (2 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.15 | Employee grid render | 8 employee cards với avatar, role badge, utilization bar | ⬜ |
| T1.16 | Dept summary KPIs | 4 department cards: Kiến trúc, Ban GĐ, Kinh doanh, Kế toán | ⬜ |

### Timesheets (2 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.17 | Timesheet grid render | 3 projects × 6 days grid, có thể nhập giờ | ⬜ |
| T1.18 | Edit hours → total updates | Nhập giờ → tổng ngày, tổng tuần, progress bar tự động update | ⬜ |

### Reports (2 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.19 | Reports page — 4 charts render | Revenue/Cost bar chart, Utilization bars, Cash flow area chart, Pie chart | ⬜ |
| T1.20 | KPIs hiển thị đúng | Doanh thu 6 tháng, Lợi nhuận, Tổng giờ, Leads→HĐ conversion | ⬜ |

### Navigation (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T1.21 | Sidebar — all menu items navigate đúng | Click mỗi menu item → đúng route, active state highlight | ⬜ |
| T1.22 | Header search input | Input hiển thị, có thể type (chưa cần functional) | ⬜ |
| T1.23 | Notification bell | Icon hiển thị với badge number | ⬜ |
| T1.24 | Finance → redirect | `/finance` auto redirect → `/finance/invoices` | ⬜ |

---

## 🟡 TIER 2: EDGE CASES & RESPONSIVE (18 cases)

### Data States (6 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T2.1 | Timesheet — nhập số âm | Không cho phép (min=0) | ⬜ |
| T2.2 | Timesheet — nhập số > 12 | Max = 12 hoặc warning | ⬜ |
| T2.3 | CRM Kanban — column trống | Column vẫn render đúng, nút "Thêm lead" hiển thị | ⬜ |
| T2.4 | Currency formatting | Tất cả giá trị tiền hiển thị đúng format VNĐ | ⬜ |
| T2.5 | Date formatting | Dates hiển thị đúng locale Vietnamese | ⬜ |
| T2.6 | Long text trong table cells | Text không overflow, truncate hoặc wrap đúng | ⬜ |

### Responsive Design (6 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T2.7 | Mobile 375px — Sidebar | Sidebar collapse hoặc hidden, hamburger menu | ⬜ |
| T2.8 | Mobile 375px — Data tables | Tables scrollable horizontally | ⬜ |
| T2.9 | Tablet 768px — Dashboard | KPI cards stack 2×2, charts resize | ⬜ |
| T2.10 | Desktop 1920px — Layout | Full sidebar, content không quá stretch | ⬜ |
| T2.11 | Mobile — Kanban board | Columns stack vertical hoặc horizontal scroll | ⬜ |
| T2.12 | Mobile — Login page | Form responsive, buttons full width | ⬜ |

### Interactions (6 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T2.13 | Employee card hover | translateY(-2px) + box-shadow animation | ⬜ |
| T2.14 | Kanban card hover | Visual feedback on hover | ⬜ |
| T2.15 | Button hover states | All buttons có hover effect consistent | ⬜ |
| T2.16 | Chart tooltips | Hover chart → tooltip hiện data đúng format | ⬜ |
| T2.17 | Badge colors consistent | State badges (success, warning, info, danger) đúng semantic | ⬜ |
| T2.18 | Progress bars animation | Smooth width transition | ⬜ |

---

## 🟢 TIER 3: PERFORMANCE, SECURITY & A11Y (12 cases)

### Performance (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T3.1 | Dashboard initial load | < 3s trên localhost | ⬜ |
| T3.2 | Page navigation speed | Transition < 500ms | ⬜ |
| T3.3 | Recharts render | Charts animate smooth, no jank | ⬜ |
| T3.4 | CSS bundle size | `globals.css` 18.7KB → check if minified in production | ⬜ |

### Security (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T3.5 | No secrets in client code | Kiểm tra source code client không lộ API keys | ⬜ |
| T3.6 | Session cookie httpOnly | Cookie `vtn-session` có httpOnly flag | ⬜ |
| T3.7 | `.env` in `.gitignore` | `.env` files không bị commit | ⬜ |
| T3.8 | `npm audit` | Dependencies không có critical vulnerabilities | ⬜ |

### Accessibility (4 cases)

| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| T3.9 | Keyboard navigation | Tab qua sidebar menu, forms, buttons | ⬜ |
| T3.10 | Color contrast | Text readable trên background colors | ⬜ |
| T3.11 | Heading hierarchy | Mỗi page có h1 duy nhất, hierarchy đúng | ⬜ |
| T3.12 | Form labels | Input fields có label hoặc aria-label | ⬜ |

---

## Execution Guide

### How to Test

```
✅ PASS — Hoạt động đúng
❌ FAIL — Không đúng expected (ghi chi tiết)
⏭️ SKIP — Không applicable
⚠️ PARTIAL — Hoạt động nhưng có issue nhỏ
```

### Priority

1. **Tier 1 PHẢI pass 100%** trước khi release
2. Tier 2 recommended cho production quality
3. Tier 3 optional cho professional grade

---

*Generated by Vibecode Kit v4.0 — QA INSPECTOR Protocol*
