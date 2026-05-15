import { test, expect } from './fixtures'

test.describe('Audit Log — Nhật ký hoạt động', () => {
    test('should load audit page without crash', async ({ authedPage: page }) => {
        const response = await page.goto('/audit')
        // Check for server error
        const status = response?.status() ?? 0
        if (status >= 500) {
            test.fail(true, `Server returned HTTP ${status} — audit page is crashing`)
        }
        // Check for Next.js error boundary
        const hasError = await page.locator('text=Có lỗi xảy ra').isVisible({ timeout: 3_000 }).catch(() => false)
        if (hasError) {
            test.fail(true, 'Audit page shows "Có lỗi xảy ra" error boundary — Server Component render failed')
        }
        await expect(page.getByRole('heading', { name: /nhật ký hoạt động/i })).toBeVisible({ timeout: 10_000 })
    })

    test('should display audit log filters', async ({ authedPage: page }) => {
        await page.goto('/audit')
        // Should have action + entity filter dropdowns (rendered as combobox)
        await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should display audit log entries or empty state', async ({ authedPage: page }) => {
        await page.goto('/audit')
        // Page shows "X bản ghi" counter when entries exist, or empty message
        const hasRecords = await page.locator('text=/\\d+ bản ghi/').isVisible({ timeout: 10_000 }).catch(() => false)
        const hasEmpty = await page.locator('text=Chưa có hoạt động nào').isVisible({ timeout: 3_000 }).catch(() => false)
        expect(hasRecords || hasEmpty).toBe(true)
    })

    test('should have pagination if many entries', async ({ authedPage: page }) => {
        await page.goto('/audit')
        // Check for pagination or record count
        await expect(page.locator('body')).toContainText(/bản ghi/, { timeout: 10_000 })
    })
})

test.describe('Reports — Báo cáo (Extended)', () => {
    test('should show 4 KPI cards', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('.kpi-card')).toHaveCount(4, { timeout: 10_000 })
    })

    test('should show Utilization Rate section', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('text=Utilization Rate')).toBeVisible({ timeout: 10_000 })
    })

    test('should show project progress section', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('text=Tiến độ Dự án')).toBeVisible({ timeout: 10_000 })
    })

    test('should show lead sources section', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('text=Nguồn khách hàng')).toBeVisible({ timeout: 10_000 })
    })

    test('should show invoice status section', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('text=Tình trạng Hóa đơn')).toBeVisible({ timeout: 10_000 })
    })

    test('should show payroll summary table', async ({ authedPage: page }) => {
        await page.goto('/reports')
        // Payroll table with "Kỳ lương" header
        const hasPayroll = await page.locator('text=Tổng hợp Bảng lương').isVisible({ timeout: 5_000 }).catch(() => false)
        if (hasPayroll) {
            await expect(page.locator('th:has-text("Kỳ lương")')).toBeVisible()
            await expect(page.locator('th:has-text("Tổng Gross")')).toBeVisible()
            await expect(page.locator('th:has-text("Thực chi")')).toBeVisible()
        }
    })

    test('should display export button for Director', async ({ authedPage: page }) => {
        await page.goto('/reports')
        await expect(page.locator('a[href="/api/reports/export"]')).toBeVisible({ timeout: 5_000 })
    })

    test('should display real currency values in KPIs', async ({ authedPage: page }) => {
        await page.goto('/reports')
        // KPIs should show VND amounts
        await expect(page.locator('.kpi-card').first()).toContainText('₫', { timeout: 10_000 })
    })
})
