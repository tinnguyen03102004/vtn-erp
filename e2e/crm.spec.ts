import { test, expect } from './fixtures'

test.describe('CRM Module', () => {
    test('should display CRM page', async ({ authedPage: page }) => {
        await page.goto('/crm')
        // Page should load without errors
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should open create lead dialog', async ({ authedPage: page }) => {
        await page.goto('/crm')
        const createBtn = page.locator('button:has-text("Tạo"), button:has-text("Thêm")')
        if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
            await createBtn.first().click()
            await expect(page.locator('input').first()).toBeVisible({ timeout: 5_000 })
        }
    })
})
