import { test as base, expect, type Page } from '@playwright/test'

/**
 * Shared login helper for E2E tests.
 * Logs in as director and navigates to /dashboard.
 */
async function loginAsDirector(page: Page) {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'director@vtn.vn')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 10_000 })
}

/**
 * Authenticated test fixture: every test starts logged in.
 */
export const test = base.extend<{ authedPage: Page }>({
    authedPage: async ({ page }, runWithPage) => {
        await loginAsDirector(page)
        await runWithPage(page)
    },
})

export { expect }
