# HR & Payroll Module — E2E Test Spec

## Module Routes
- `/employees` — Employee listing
- `/employees/new` — Create employee
- `/employees/[id]` — Employee detail
- `/timesheets` — Timesheet management
- `/payroll` — Payroll dashboard
- `/payroll/run` — Monthly payroll run

## Business Rules
- Company pays all insurance (BHXH 17.5%, BHYT 3%, BHTN 1%)
- 7-tier progressive tax (Vietnam 2026)
- Late tracking: >5min = late, 3 lates = 0.5 day deduction
- Allowances: transportation, meals, phone

## Test Scenarios

### Employee Management
1. **View Employees** — Login → Navigate to `/employees` → Assert employee list renders
2. **Create Employee** — Fill form (name, email, position, salary) → Save → Assert in list
3. **Edit Employee** — Update salary, position → Save → Assert updated
4. **Employee Profile** — Click employee → Assert detail page shows all info

### Timesheet / Attendance
5. **View Timesheets** — Navigate to `/timesheets` → Assert calendar/table view
6. **Record Attendance** — Check-in/check-out entry → Assert time recorded
7. **Late Tracking** — Entry with late arrival → Assert late flag
8. **Monthly Summary** — Select month → Assert working days, late count, leave days

### Payroll
9. **Run Payroll** — Navigate to `/payroll/run` → Select month → Calculate
10. **Verify Gross Salary** — Assert base salary + allowances
11. **Verify Insurance Deductions** — Assert BHXH/BHYT/BHTN calculated correctly
12. **Verify Tax** — Assert progressive tax applied correctly
13. **Verify Net Salary** — Assert gross - insurance - tax = net
14. **Payroll Report** — Generate report → Assert all employees listed with correct amounts
15. **Export Payslip** — Export individual payslip → Assert PDF generated

### Edge Cases
16. **New Employee Mid-Month** — Pro-rated salary calculation
17. **Zero Salary Employee** — Handle gracefully
18. **Multiple Late Entries** — 3+ lates → deduction applied
