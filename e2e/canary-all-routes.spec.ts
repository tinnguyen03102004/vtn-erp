import { test, expect } from './fixtures'

/**
 * CANARY TEST — Navigate ALL sidebar routes, assert no crash.
 * 
 * Purpose: Prevent "blind spot" where a module has 0 tests
 * and a server-side crash goes undetected (like the Audit/range bug).
 * 
 * This single test covers the gap analysis finding:
 * "Route Coverage Map — compare sidebar routes vs test files"
 */

const ALL_SIDEBAR_ROUTES = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/crm', label: 'CRM & Leads' },
    { path: '/sale', label: 'Báo giá & HĐ' },
    { path: '/projects', label: 'Quản lý dự án' },
    { path: '/timesheets', label: 'Timesheet' },
    { path: '/finance/invoices', label: 'Hóa đơn' },
    { path: '/finance/costs', label: 'Chi phí dự án' },
    { path: '/payroll', label: 'Bảng lương' },
    { path: '/employees', label: 'Nhân viên' },
    { path: '/attendance', label: 'Quản lý chấm công' },
    { path: '/settings', label: 'Cài đặt' },
]

test.describe('Canary — All Routes Health Check', () => {
    for (const route of ALL_SIDEBAR_ROUTES) {
        test(`${route.label} (${route.path}) should not crash`, async ({ authedPage: page }) => {
            const response = await page.goto(route.path)
            const status = response?.status() ?? 0

            // 1. No HTTP 500 errors
            expect(status, `${route.path} returned HTTP ${status}`).toBeLessThan(500)

            // 2. No Next.js error boundary visible
            const errorBoundary = page.locator('text=Có lỗi xảy ra')
            const hasError = await errorBoundary.isVisible({ timeout: 5_000 }).catch(() => false)
            
            if (hasError) {
                // Capture the error message for debugging
                const errorText = await page.locator('body').innerText().catch(() => 'unknown')
                const errorMsg = errorText.match(/Có lỗi xảy ra(.+?)(?:Thử lại|$)/s)?.[1]?.trim() || 'unknown error'
                expect(hasError, `${route.path} shows error boundary: ${errorMsg}`).toBe(false)
            }

            // 3. Page has meaningful content (h1 or h2 or main content)
            const hasContent = await page.locator('h1, h2, main').first().isVisible({ timeout: 10_000 }).catch(() => false)
            expect(hasContent, `${route.path} has no visible content`).toBe(true)
        })
    }
})
