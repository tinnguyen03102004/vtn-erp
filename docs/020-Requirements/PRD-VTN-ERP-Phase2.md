# PRD — VTN-ERP Phase 2: UX Polish & Hoàn thiện

> **Version**: 2.0 | **Date**: 2026-03-06

## Summary

Phase 1 hoàn thành 100% — CRUD đầy đủ cho 4 modules (CRM, Sale, Projects, Finance) + Settings. Phase 2 tập trung vào hoàn thiện 2 modules còn thiếu (HR, User Management) và nâng cao trải nghiệm người dùng.

## Users: ~30 người (VTN Architects team)

## MoSCoW Prioritization

### Must Have (M3)

| # | Feature | Module | Effort |
|---|---------|--------|--------|
| 1 | CRUD Employee (thêm/sửa nhân viên) | HR | S |
| 2 | Tạo/sửa Timesheet entries | HR | M |
| 3 | User management (thêm/sửa/khóa) | System | M |
| 4 | RBAC enforcement (phân quyền) | System | L |

### Should Have (M4)

| # | Feature | Module | Effort |
|---|---------|--------|--------|
| 5 | Global search | UX | M |
| 6 | Responsive mobile layout | UX | L |
| 7 | Dashboard charts (doanh thu, pipeline) | Dashboard | M |
| 8 | Form validation (client + server) | System | M |
| 9 | Export PDF invoices | Finance | M |

### Could Have

| # | Feature | Module | Effort |
|---|---------|--------|--------|
| 10 | Keyboard shortcuts | UX | S |
| 11 | Leave Management | HR | M |
| 12 | Loading skeletons | UX | S |
| 13 | Error boundaries | System | S |

## Execution Order

```
Sprint 6: HR CRUD (Employee + Timesheet) → 2 stories
Sprint 7: User Management + RBAC → 2 stories
Sprint 8: UX (Search + Charts + Mobile) → 3 stories
Sprint 9: Quality (Validation + PDF + Polish) → 3 stories
```
