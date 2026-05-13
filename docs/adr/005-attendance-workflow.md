# ADR-005: Attendance Import & Review Workflow

**Status:** Accepted  
**Date:** 2026-05-10  
**Decision Makers:** Technical Lead, HR Team

## Context

Chấm công tại VTN hiện dùng máy chấm công vân tay, xuất file Excel. Cần hệ thống import + cho phép nhân viên bổ sung chấm công thiếu, HR duyệt.

## Decision

Thiết kế 3-state workflow cho attendance:

```
DRAFT → REVIEW → LOCKED
  ↑        ↓
  └── (unlock) ←┘
```

- **Import**: HR upload Excel → parser tạo records tự động
- **Employee self-service**: Nhân viên bổ sung ngày thiếu → `state = PENDING`
- **HR review**: Duyệt/từ chối từng record bổ sung
- **Lock**: Chỉ lock khi không còn PENDING, dữ liệu sẵn sàng cho payroll

## Rationale

1. **Audit trail** — Mỗi record có `source` (MACHINE / EMPLOYEE_ADDED) và `state`
2. **Separation from Payroll** — Attendance periods tách biệt payroll periods, link qua date range
3. **Conflict resolution** — Nếu cả machine + employee có data → employee overwrite, nhưng giữ trạng thái PENDING để HR review

## Alternatives Considered

1. **Real-time GPS check-in** — Rejected: chưa cần, infrastructure phức tạp
2. **Merge attendance vào timesheets** — Rejected: 2 concepts khác nhau (chấm công vs timesheet dự án)

## Consequences

- Phải handle batch insert (50 records/batch) cho performance
- Payroll chỉ đọc LOCKED periods → ensure data consistency
- Employee UI cần show rõ ngày nào MACHINE vs EMPLOYEE_ADDED
