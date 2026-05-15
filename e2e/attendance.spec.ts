import { test, expect } from './fixtures'

test.describe('Attendance Module — Chấm công', () => {
    test('should display attendance page with title', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        await expect(page.locator('h1')).toContainText('Chấm công')
    })

    test('should show subtitle describing the module', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        await expect(page.locator('text=Quản lý kỳ chấm công')).toBeVisible({ timeout: 10_000 })
    })

    test('should show Import Excel button', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        await expect(page.locator('text=Import Excel')).toBeVisible({ timeout: 10_000 })
    })

    test('should show periods table with columns', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        // Table should have header columns
        const table = page.locator('table')
        await expect(table).toBeVisible({ timeout: 10_000 })
        await expect(table.locator('th', { hasText: 'Kỳ chấm công' })).toBeVisible()
        await expect(table.locator('th', { hasText: 'Trạng thái' })).toBeVisible()
        await expect(table.locator('th', { hasText: 'Nhân viên' })).toBeVisible()
    })

    test('should display periods or empty state', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        // Either has period rows with "Xem chi tiết →" links, or shows empty message
        const hasPeriods = await page.locator('text=Xem chi tiết →').first()
            .isVisible({ timeout: 8_000 }).catch(() => false)
        const hasEmpty = await page.locator('text=Chưa có kỳ chấm công nào')
            .isVisible({ timeout: 3_000 }).catch(() => false)
        expect(hasPeriods || hasEmpty).toBe(true)
    })

    test('should open import modal when clicking Import button', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        await page.locator('text=Import Excel').click()
        // Modal should appear with file upload area
        await expect(page.locator('text=Import chấm công từ Excel')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=Chọn file Excel từ máy chấm công')).toBeVisible()
    })

    test('should close import modal with X button', async ({ authedPage: page }) => {
        await page.goto('/attendance')
        await page.locator('text=Import Excel').click()
        await expect(page.locator('text=Import chấm công từ Excel')).toBeVisible({ timeout: 5_000 })
        // Click the close button (✕)
        await page.locator('text=✕').click()
        await expect(page.locator('text=Import chấm công từ Excel')).not.toBeVisible({ timeout: 3_000 })
    })
})
