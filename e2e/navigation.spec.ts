import { test, expect } from './fixtures'

test.describe('Navigation & Sidebar', () => {
    test('should navigate to all main modules', async ({ authedPage: page }) => {
        // Use actual routes from the sidebar (not /employees directly — uses /employees but may have redirect)
        const routes = ['/crm', '/sale', '/projects', '/finance/invoices', '/payroll']

        for (const path of routes) {
            await page.goto(path)
            // Should not redirect to login (authenticated)
            await expect(page).not.toHaveURL(/login/, { timeout: 5_000 })
            // Page should render (h1 or h2 visible)
            await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
        }
    })

    test('should display sidebar with navigation', async ({ authedPage: page }) => {
        await page.goto('/dashboard')
        const sidebar = page.locator('nav, aside, [role="navigation"]').first()
        await expect(sidebar).toBeVisible({ timeout: 5_000 })
    })
})
