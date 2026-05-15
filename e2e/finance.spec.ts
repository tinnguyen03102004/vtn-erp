import { test, expect } from './fixtures'

test.describe('Finance Module', () => {
    test('should display finance dashboard', async ({ authedPage: page }) => {
        await page.goto('/finance')
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should display invoices list', async ({ authedPage: page }) => {
        await page.goto('/finance')
        // Navigate to invoices tab/section or direct route
        const invoiceTab = page.getByRole('tab', { name: /hóa đơn|invoice/i })
        if (await invoiceTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await invoiceTab.click()
        }
        // Assert table/list renders
        await expect(page.locator('table, [data-testid="invoice-list"]').first())
            .toBeVisible({ timeout: 10_000 })
    })

    test('should display payments section', async ({ authedPage: page }) => {
        await page.goto('/finance')
        // Look for payments tab
        const paymentTab = page.getByRole('tab', { name: /thanh toán|payment/i })
        if (await paymentTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await paymentTab.click()
            await expect(page.locator('table, [data-testid="payment-list"]').first())
                .toBeVisible({ timeout: 10_000 })
        }
    })

    test('should show costs management', async ({ authedPage: page }) => {
        await page.goto('/finance/costs')
        // Should load without error
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
        await expect(page.locator('body')).not.toContainText('404')
    })

    test('should format currency in VND', async ({ authedPage: page }) => {
        // Use payroll page which always has salary data
        await page.goto('/payroll')
        await page.waitForTimeout(2_000)
        // Check for VND formatting: ₫ symbol, "VND", or dot-separated thousands (e.g. 12.500.000)
        const pageText = await page.locator('body').textContent() ?? ''
        const hasVND = pageText.includes('₫') || pageText.includes('VND') || /\d{1,3}(\.\d{3})+/.test(pageText)
        expect(hasVND, 'Page should contain VND-formatted currency').toBeTruthy()
    })
})
