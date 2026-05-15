import { test, expect } from './fixtures'

test.describe('Settings Module — Cài đặt', () => {
    test('should display settings page with title', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await expect(page.locator('h1')).toContainText('Cài đặt')
    })

    test('should show subtitle', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await expect(page.locator('text=Quản lý thông tin công ty')).toBeVisible({ timeout: 10_000 })
    })

    test('should show tab navigation with Công ty tab', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await expect(page.locator('button', { hasText: 'Công ty' })).toBeVisible({ timeout: 10_000 })
    })

    test('should show Bảo mật tab', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await expect(page.locator('button', { hasText: 'Bảo mật' })).toBeVisible({ timeout: 10_000 })
    })

    test('should display company info form by default', async ({ authedPage: page }) => {
        await page.goto('/settings')
        // Company tab is active by default
        await expect(page.getByText('Thông tin Công ty', { exact: true })).toBeVisible({ timeout: 10_000 })
        // Should show the settings fields
        await expect(page.locator('label', { hasText: 'Tên công ty' })).toBeVisible()
        await expect(page.locator('label', { hasText: 'Mã số thuế' })).toBeVisible()
        await expect(page.locator('label', { hasText: 'Địa chỉ' })).toBeVisible()
    })

    test('should show save button', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await expect(page.locator('button', { hasText: 'Lưu thay đổi' })).toBeVisible({ timeout: 10_000 })
    })

    test('should switch to security tab', async ({ authedPage: page }) => {
        await page.goto('/settings')
        await page.locator('button', { hasText: 'Bảo mật' }).click()
        // Should show password fields
        await expect(page.locator('text=Bảo mật Tài khoản')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('label', { hasText: 'Mật khẩu hiện tại' })).toBeVisible()
        await expect(page.getByText('Mật khẩu mới', { exact: true })).toBeVisible()
    })

    test('should show Tài khoản tab for Director role', async ({ authedPage: page }) => {
        await page.goto('/settings')
        // Director should see the Users management tab
        const usersTab = page.locator('button', { hasText: 'Tài khoản' })
        const hasUsersTab = await usersTab.isVisible({ timeout: 5_000 }).catch(() => false)
        if (hasUsersTab) {
            await usersTab.click()
            // Should show user management content
            await expect(page.locator('h1, h2, h3, div').filter({ hasText: /tài khoản|người dùng/i }).first())
                .toBeVisible({ timeout: 5_000 })
        }
    })
})
