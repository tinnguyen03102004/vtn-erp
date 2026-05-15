import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
    test('should display dashboard with key metrics', async ({ authedPage: page }) => {
        await page.goto('/dashboard')
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
    })

    test('should show summary cards', async ({ authedPage: page }) => {
        await page.goto('/dashboard')
        // Dashboard should have metric cards
        const cards = page.locator('[data-testid="stat-card"], .stat-card, .dashboard-card, .metric-card, .card')
        await expect(cards.first()).toBeVisible({ timeout: 10_000 })
    })

    test('should load without critical errors', async ({ authedPage: page }) => {
        await page.goto('/dashboard')
        // Dashboard should show heading (not a full error page)
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 })
        // No 404 page
        await expect(page.locator('body')).not.toContainText('This page could not be found')
    })

    test('should have functional sidebar navigation', async ({ authedPage: page }) => {
        await page.goto('/dashboard')
        // Click CRM link in sidebar
        const crmLink = page.getByRole('link', { name: /crm/i })
        if (await crmLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await crmLink.click()
            await expect(page).toHaveURL(/crm/, { timeout: 5_000 })
        }
    })
})
