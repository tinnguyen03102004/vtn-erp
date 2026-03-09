import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login')
        await expect(page.locator('h2')).toContainText('Đăng nhập')
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should reject invalid credentials', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[type="email"]', 'wrong@test.com')
        await page.fill('input[type="password"]', 'wrongpass')
        await page.click('button[type="submit"]')

        // Should show error message
        await expect(page.locator('.login-error')).toBeVisible({ timeout: 10_000 })
    })

    test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[type="email"]', 'director@vtn.vn')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')

        // Should redirect to dashboard
        await page.waitForURL('/dashboard', { timeout: 10_000 })
    })

    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/crm')
        await expect(page).toHaveURL(/login/)
    })

    test('should fill demo account on button click', async ({ page }) => {
        await page.goto('/login')
        // Click Director demo button
        await page.click('.login-demo-btn >> text=Director')

        const emailInput = page.locator('input[type="email"]')
        await expect(emailInput).toHaveValue('director@vtn.vn')
    })
})
