# VTN ERP — End-to-End Test Specs

This directory contains test plan specifications for each ERP module.
Playwright Agents (Planner → Generator → Healer) use these specs to automatically generate and maintain E2E tests.

## Modules

| Module | Spec File | Status |
|--------|-----------|--------|
| Authentication | [auth-module.md](auth-module.md) | ✅ Ready |
| CRM & Sales | [crm-sales-module.md](crm-sales-module.md) | ✅ Ready |
| HR & Payroll | [hr-payroll-module.md](hr-payroll-module.md) | ✅ Ready |
| Projects & Timesheets | [projects-module.md](projects-module.md) | ✅ Ready |
| Finance | [finance-module.md](finance-module.md) | ✅ Ready |

## How to Use

### With Playwright Agents (VS Code)
1. Open VS Code agent panel
2. Select **playwright-test-planner** agent
3. Prompt: `Generate a test plan for the CRM module using specs/crm-sales-module.md`
4. Review generated plan
5. Switch to **playwright-test-generator** → generate tests from plan
6. Switch to **playwright-test-healer** → run and fix any failures

### Agent Loop (CI/CD)
```bash
# Run all E2E tests with auto-retry
npx playwright test --retries=3

# Run specific module
npx playwright test e2e/crm/ --retries=3
```
