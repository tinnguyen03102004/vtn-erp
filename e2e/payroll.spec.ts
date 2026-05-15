import { test, expect } from './fixtures'

test.describe('Payroll Module', () => {
    test('should display payroll page', async ({ authedPage: page }) => {
        await page.goto('/payroll')
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should show payroll table with employee data', async ({ authedPage: page }) => {
        await page.goto('/payroll')
        // Assert payroll table renders
        await expect(page.locator('table, [data-testid="payroll-table"]').first())
            .toBeVisible({ timeout: 10_000 })
    })

    test('should display salary columns', async ({ authedPage: page }) => {
        await page.goto('/payroll')
        await page.waitForTimeout(2_000)
        const pageText = await page.locator('body').textContent() || ''
        // Should contain salary-related terms
        const hasSalaryTerms = /lương|salary|bhxh|bảo hiểm|thuế|tax|net/i.test(pageText)
        expect(hasSalaryTerms).toBeTruthy()
    })

    test('should navigate to payroll detail', async ({ authedPage: page }) => {
        await page.goto('/payroll')
        const firstRow = page.locator('table tbody tr').first()
        if (await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await firstRow.click()
            await page.waitForTimeout(1_000)
            // Should show detail or keep on page (not 404)
            await expect(page.locator('body')).not.toContainText('404')
        }
    })
})
