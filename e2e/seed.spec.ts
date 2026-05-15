import { test, expect } from '@playwright/test';

/**
 * VTN ERP Seed Test - base environment verification.
 * Demo accounts all use password: password123.
 */
test.describe('VTN ERP Seed Environment', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should authenticate as Director', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('hang@vtn.vn');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
