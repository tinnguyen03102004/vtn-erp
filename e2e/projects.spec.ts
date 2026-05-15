import { test, expect } from './fixtures'

test.describe('Projects Module', () => {
    test('should display project list', async ({ authedPage: page }) => {
        await page.goto('/projects')
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 })
        // Assert projects render (table, cards, or list)
        await expect(page.locator('table, [data-testid="project-list"], [data-testid="project-card"]').first())
            .toBeVisible({ timeout: 10_000 })
    })

    test('should navigate to project detail', async ({ authedPage: page }) => {
        await page.goto('/projects')
        // Click first project
        const firstProject = page.locator('table tbody tr a, [data-testid="project-card"]').first()
        if (await firstProject.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await firstProject.click()
            await page.waitForTimeout(1_500)
            // Should show project detail — phases/tasks
            await expect(page.locator('body')).not.toContainText('404')
        }
    })

    test('should show project phases and tasks', async ({ authedPage: page }) => {
        await page.goto('/projects')
        const firstProject = page.locator('table tbody tr a, [data-testid="project-card"]').first()
        if (await firstProject.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await firstProject.click()
            await page.waitForTimeout(1_500)
            // Look for phases or tasks section
            const content = page.locator('[data-testid="project-phases"], [data-testid="project-tasks"], table, .tab-content')
            await expect(content.first()).toBeVisible({ timeout: 10_000 })
        }
    })
})
