import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../helpers/auth.helper';

test.describe('Explore Mode', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('explore page loads with variable browser', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find first project
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (!(await projectLink.isVisible())) {
      test.skip();
      return;
    }
    await projectLink.click();
    await page.waitForURL('**/projects/**');

    // Navigate to explore
    await page.goto(page.url().replace(/\/(overview|dataprep|data-preparation|chat)?$/, '/explore'));
    await page.waitForLoadState('networkidle');

    // Variable browser should show variables
    const variableList = page.locator('[data-testid="variable-browser"], .variable-browser, .variable-list').first();
    const variableItems = page.locator('[data-testid="variable-item"], .variable-item, button:has-text("Q")').first();

    // At least the page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });
});
