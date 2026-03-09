import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'director@vtn.vn')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10_000 })
}

test.describe('Navigation & Sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
    })

    test('should navigate to all main modules', async ({ page }) => {
        const routes = ['/crm', '/sale', '/projects', '/finance', '/employees']

        for (const path of routes) {
            await page.goto(path)
            // Should not redirect to login (authenticated)
            await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
            // Page should render (h1 or h2 visible)
            await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
        }
    })

    test('should display sidebar with navigation', async ({ page }) => {
        await page.goto('/dashboard')
        const sidebar = page.locator('nav, aside, [role="navigation"]').first()
        await expect(sidebar).toBeVisible({ timeout: 5_000 })
    })
})
