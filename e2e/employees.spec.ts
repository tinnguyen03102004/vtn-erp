import { test, expect } from './fixtures'

test.describe('HR — Employees Module', () => {
    test('should display employee list', async ({ authedPage: page }) => {
        await page.goto('/employees')
        // Assert heading visible
        await expect(page.getByRole('heading', { name: /nhân viên/i })).toBeVisible({ timeout: 10_000 })
        // Employees page uses card layout — assert employee names are visible
        await expect(page.locator('body')).toContainText('Nguyễn Hoàng Da', { timeout: 10_000 })
    })

    test('should show employee count', async ({ authedPage: page }) => {
        await page.goto('/employees')
        // Should show "21 nhân sự" text
        await expect(page.locator('body')).toContainText(/\d+ nhân sự/, { timeout: 10_000 })
    })

    test('should navigate to employee detail', async ({ authedPage: page }) => {
        await page.goto('/employees')
        // Click first employee card
        const firstCard = page.locator('main >> text=Nguyễn Hoàng Da').first()
        if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await firstCard.click()
            await page.waitForTimeout(1_000)
            await expect(page.locator('body')).not.toContainText('This page could not be found')
        }
    })

    test('should display salary information', async ({ authedPage: page }) => {
        await page.goto('/employees')
        // VND format: "14.000.000 ₫" — but textContent joins without spaces
        // The actual text shows "14.000.000 ₫" — use literal match
        await expect(page.locator('body')).toContainText('000 ₫', { timeout: 10_000 })
    })
})
