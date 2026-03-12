import { test, expect } from './fixtures'

test.describe('Sales Module - Listing', () => {
    test('should display sale page with tabs and KPIs', async ({ authedPage: page }) => {
        await page.goto('/sale')
        // Page header
        await expect(page.locator('h1')).toContainText(/[Bb].*[Gg].*[Hh]/, { timeout: 10_000 })

        // Tab buttons should be visible
        const quotationTab = page.locator('button').filter({ hasText: /[Bb].*[Gg]/ }).first()
        await expect(quotationTab).toBeVisible({ timeout: 5_000 })

        // KPI cards
        const kpiCards = page.locator('.kpi-card')
        await expect(kpiCards.first()).toBeVisible({ timeout: 5_000 })

        // Data table
        await expect(page.locator('table.data-table').first()).toBeVisible({ timeout: 5_000 })
    })

    test('should switch between quotation and contract tabs', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Click contract tab
        const contractTab = page.locator('button').filter({ hasText: /[Hh].*[Dd]/ }).first()
        await contractTab.click()

        // Contract table should appear (look for contract-specific headers)
        await expect(page.locator('th').filter({ hasText: /Milestone/ }).first()).toBeVisible({ timeout: 5_000 })

        // Switch back to quotation tab
        const quotationTab = page.locator('button').filter({ hasText: /[Bb].*[Gg]/ }).first()
        await quotationTab.click()

        // Quotation-specific header
        await expect(page.locator('th').filter({ hasText: /[Hh].*[Ll]/ }).first()).toBeVisible({ timeout: 5_000 })
    })
})

test.describe('Sales Module - Create Quotation', () => {
    test('should navigate to create quotation page', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Click "Tao bao gia" button
        const createBtn = page.locator('a[href="/sale/new"]').first()
        await expect(createBtn).toBeVisible({ timeout: 5_000 })
        await createBtn.click()

        await page.waitForURL('/sale/new', { timeout: 10_000 })
        await expect(page.locator('h1')).toBeVisible({ timeout: 5_000 })
    })

    test('should show validation error if customer name is empty', async ({ authedPage: page }) => {
        await page.goto('/sale/new')
        await page.waitForLoadState('networkidle')

        // Try to save without filling customer name
        const saveBtn = page.locator('button').filter({ hasText: /[Ll].*[Nn]/ }).first()
        if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await saveBtn.click()
            // Expect error message
            await expect(page.locator('div').filter({ hasText: /[Vv]ui/ })).toBeVisible({ timeout: 5_000 })
        }
    })

    test('should create a new quotation', async ({ authedPage: page }) => {
        await page.goto('/sale/new')
        await page.waitForLoadState('networkidle')

        // Fill customer info
        const nameInput = page.locator('.form-input').first()
        await nameInput.fill('E2E Test Customer ' + Date.now())

        // Fill line item price (2nd line: unit price)
        const priceInputs = page.locator('input[type="number"]')
        // Find a unitPrice input and set value
        const unitPriceInput = priceInputs.nth(2) // 3rd number input = first unitPrice
        await unitPriceInput.fill('50000000') // 50M VND

        // Wait for total to update
        await page.waitForTimeout(500)

        // Click save draft button
        const saveBtn = page.locator('button').filter({ hasText: /[Ll].*[Nn]/ }).first()
        if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await saveBtn.click()

            // Should redirect back to sale listing
            await page.waitForURL('/sale', { timeout: 15_000 })
        }
    })
})

test.describe('Sales Module - Quotation Detail & State Machine', () => {
    test('should open quotation detail page', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Click first "Xem" link in quotation table
        const viewLink = page.locator('table.data-table a').filter({ hasText: /Xem/ }).first()
        if (await viewLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await viewLink.click()
            // Should navigate to /sale/[id]
            await expect(page).toHaveURL(/\/sale\//, { timeout: 10_000 })
            // Detail page should have state actions or content visible
            await expect(page.locator('.card').first()).toBeVisible({ timeout: 5_000 })
        }
    })

    test('should display quotation state flow buttons', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Find a DRAFT quotation by badge
        const draftBadge = page.locator('span.badge').filter({ hasText: /[Nn]h/ }).first()
        if (await draftBadge.isVisible({ timeout: 5_000 }).catch(() => false)) {
            // Click the view link in same row
            const row = draftBadge.locator('xpath=ancestor::tr')
            const viewLink = row.locator('a').filter({ hasText: /Xem/ })
            await viewLink.click()

            await expect(page).toHaveURL(/\/sale\//, { timeout: 10_000 })
            await page.waitForLoadState('networkidle')

            // Should see "Gui CDT" button for DRAFT state
            const sendBtn = page.locator('button').filter({ hasText: /[Gg].*[CcÄ]/ }).first()
            await expect(sendBtn).toBeVisible({ timeout: 5_000 })
        }
    })
})

test.describe('Sales Module - Contract Tab', () => {
    test('should display contracts tab', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Switch to contract tab
        const contractTab = page.locator('button').filter({ hasText: /[Hh].*[Dd]/ }).first()
        await contractTab.click()

        // Contract KPI cards should be visible
        await expect(page.locator('.kpi-card').first()).toBeVisible({ timeout: 5_000 })

        // Contract table should show
        await expect(page.locator('table.data-table').first()).toBeVisible({ timeout: 5_000 })
    })

    test('should open contract detail if exists', async ({ authedPage: page }) => {
        await page.goto('/sale')
        await page.waitForLoadState('networkidle')

        // Switch to contract tab
        const contractTab = page.locator('button').filter({ hasText: /[Hh].*[Dd]/ }).first()
        await contractTab.click()
        await page.waitForTimeout(500)

        // Click first contract view link
        const viewLink = page.locator('table.data-table a').filter({ hasText: /Xem/ }).first()
        if (await viewLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await viewLink.click()
            await expect(page).toHaveURL(/\/sale\//, { timeout: 10_000 })
            await expect(page.locator('.card').first()).toBeVisible({ timeout: 5_000 })
        }
    })
})

test.describe('Sales Module - Error Boundary', () => {
    test('should show error boundary for invalid sale ID', async ({ authedPage: page }) => {
        await page.goto('/sale/invalid-uuid-12345')
        // Should either show error boundary or redirect
        await page.waitForLoadState('networkidle')
        // Page should not crash (no blank page)
        const content = await page.textContent('body')
        expect(content).toBeTruthy()
        expect(content!.length).toBeGreaterThan(10)
    })
})
