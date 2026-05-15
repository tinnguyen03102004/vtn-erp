# Authentication Module — E2E Test Spec

## Base URL
`http://localhost:3000`

## Module Routes
- `/login` — Login page
- `/` — Dashboard (post-login redirect)

## Demo Accounts
| Email | Password | Role | Access Level |
|-------|----------|------|-------------|
| hang@vtn.vn | password123 | DIRECTOR | Full access |
| pm@vtn.vn | password123 | PROJECT_MANAGER | Projects, CRM, Sales |
| tung@vtn.vn | password123 | ARCHITECT | Projects, Timesheets |
| quyen@vtn.vn | password123 | FINANCE | Finance, Invoices, Payments |

## Test Scenarios

### 1. Login Success
- Navigate to `/login`
- Fill email and password
- Click login button
- Assert redirect to dashboard
- Assert user name visible in header/sidebar

### 2. Login Failure — Wrong Password
- Navigate to `/login`
- Fill valid email, wrong password
- Click login
- Assert error message displayed
- Assert still on login page

### 3. Login Failure — Empty Fields
- Navigate to `/login`
- Click login without filling fields
- Assert validation errors

### 4. Logout
- Login as Director
- Click logout button/menu
- Assert redirect to login page
- Assert cannot access dashboard without re-login

### 5. Role-Based Access Control (RBAC)
- Login as FINANCE role (quyen@vtn.vn)
- Verify can access Finance pages
- Verify restricted from Admin-only pages
- Login as DIRECTOR role (hang@vtn.vn)
- Verify can access all pages

### 6. Session Persistence
- Login successfully
- Refresh page
- Assert still logged in
- Assert session data consistent
