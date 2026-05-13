# ADR-004: Vietnam Payroll Calculation Engine

**Status:** Accepted  
**Date:** 2026-05-10  
**Decision Makers:** Technical Lead, Finance Team

## Context

VTN ERP cần tính lương cho nhân viên theo quy định Việt Nam, bao gồm:
- BHXH (8%), BHYT (1.5%), BHTN (1%)
- PIT (thuế TNCN) lũy tiến 7 bậc
- Phụ cấp, giảm trừ bản thân (11 triệu VND/tháng)

## Decision

Implement tính toán trong `@vtn/vietnam` package, tách biệt khỏi core:
- `computeSalary()` — tính lương net từ gross + attendance ratio
- `computePIT()` — tính thuế TNCN lũy tiến
- Insurance rates cấu hình qua constants, dễ update khi chính sách thay đổi

## Rationale

1. **Separation of concerns** — Logic tính lương VN tách riêng, app core không phụ thuộc
2. **Testability** — Pure functions, dễ unit test với nhiều edge cases
3. **Maintainability** — Khi luật thuế thay đổi, chỉ cần update `@vtn/vietnam`

## Alternatives Considered

1. **Tính trực tiếp trong server action** — Rejected: lẫn business logic với infra
2. **External payroll API** — Rejected: thêm dependency, latency, cost

## Consequences

- Mỗi lần chính sách BHXH/thuế thay đổi, cập nhật `packages/vietnam/`
- Need integration test so sánh kết quả với bảng lương mẫu thực tế
