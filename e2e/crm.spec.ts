import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'director@vtn.vn')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10_000 })
}

test.describe('CRM Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('should display CRM page', async ({ page }) => {
        await page.goto('/crm')
        // Page should load without errors
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should open create lead dialog', async ({ page }) => {
        await page.goto('/crm')
        const createBtn = page.locator('button:has-text("Tạo"), button:has-text("Thêm")')
        if (await createBtn.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
            await createBtn.first().click()
            await expect(page.locator('input').first()).toBeVisible({ timeout: 5_000 })
        }
    })
})
