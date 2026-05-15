import { test, expect } from './fixtures'

test.describe('Timesheets Module', () => {
    test('should display timesheet page', async ({ authedPage: page }) => {
        await page.goto('/timesheets')
        await expect(page.getByRole('heading', { name: /timesheet/i })).toBeVisible({ timeout: 10_000 })
    })

    test('should show timesheet table with employee data', async ({ authedPage: page }) => {
        await page.goto('/timesheets')
        // Timesheet has a table with employee rows
        await expect(page.locator('table').first()).toBeVisible({ timeout: 10_000 })
        // Should contain employee names
        await expect(page.locator('body')).toContainText('Nguyễn Văn Tùng', { timeout: 10_000 })
    })

    test('should show month/year selectors', async ({ authedPage: page }) => {
        await page.goto('/timesheets')
        // Has month combobox
        await expect(page.locator('select, [role="combobox"]').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should display summary statistics', async ({ authedPage: page }) => {
        await page.goto('/timesheets')
        await page.waitForTimeout(2_000)
        // Should show "Tổng giờ tháng" metric
        await expect(page.locator('body')).toContainText(/tổng giờ/i, { timeout: 10_000 })
    })

    test('should show total row in table footer', async ({ authedPage: page }) => {
        await page.goto('/timesheets')
        // Table has a summary row with "Tổng cộng"
        await expect(page.locator('body')).toContainText(/tổng cộng/i, { timeout: 10_000 })
    })
})
