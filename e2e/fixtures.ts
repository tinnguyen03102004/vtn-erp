import { test as base, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

/**
 * Shared login helper for E2E tests.
 * Logs in as director and navigates to /dashboard.
 */
async function loginAsDirector(page: Page) {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'hang@vtn.vn')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10_000 })
}

async function hasValidSession(page: Page) {
    await page.goto(`${BASE_URL}/dashboard`)
    return page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5_000 })
        .then(() => true)
        .catch(() => false)
}

/**
 * Authenticated test fixture: each worker logs in once and reuses storage state.
 * This keeps module tests from tripping the app's login rate limit.
 */
export const test = base.extend<{ authedPage: Page }, { workerStorageState: string }>({
    storageState: ({ workerStorageState }, use) => use(workerStorageState),
    workerStorageState: [async ({ browser }, use) => {
        const workerId = test.info().parallelIndex
        const authDir = path.join(test.info().project.outputDir, '.auth')
        const fileName = path.join(authDir, `director-${workerId}.json`)

        fs.mkdirSync(authDir, { recursive: true })

        if (fs.existsSync(fileName)) {
            const page = await browser.newPage({ storageState: fileName })
            const isValid = await hasValidSession(page)
            await page.close()
            if (isValid) {
                await use(fileName)
                return
            }
            fs.rmSync(fileName, { force: true })
        }

        const loginPage = await browser.newPage({ storageState: undefined })
        await loginAsDirector(loginPage)
        await loginPage.context().storageState({ path: fileName })
        await loginPage.close()
        await use(fileName)
    }, { scope: 'worker' }],
    authedPage: async ({ page }, runWithPage) => {
        await page.goto('/dashboard')
        await page.waitForURL('/dashboard', { timeout: 10_000 })
        await runWithPage(page)
    },
})

export { expect }
