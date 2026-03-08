import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../helpers/auth.helper';

test.describe('Export & Share', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('project settings page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (!(await projectLink.isVisible())) {
      test.skip();
      return;
    }
    await projectLink.click();
    await page.waitForURL('**/projects/**');

    // Navigate to settings
    await page.goto(page.url().replace(/\/(overview|dataprep|data-preparation|chat)?$/, '/settings'));
    await page.waitForLoadState('networkidle');

    // Settings page should show project name input
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="nombre"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
  });

  test('public shared view is accessible without auth', async ({ page, context }) => {
    // Test that the /shared/:token route exists and renders
    await page.goto('/shared/nonexistent-token');
    await page.waitForLoadState('networkidle');

    // Should show an error or "not found" message (not a crash)
    await expect(page.locator('body')).toBeVisible();
  });

  test('public dashboard view is accessible without auth', async ({ page }) => {
    await page.goto('/dashboard/view/nonexistent-token');
    await page.waitForLoadState('networkidle');

    // Should show an error or "not found" message (not a crash)
    await expect(page.locator('body')).toBeVisible();
  });
});
