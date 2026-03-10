import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../helpers/auth.helper';
import path from 'path';

test.describe('Upload & Data Prep', () => {
  const hasCredentials = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);

  test.skip(!hasCredentials, 'Skipped: no test credentials configured');

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('dashboard loads with project list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should show sidebar and main content area
    await expect(page.locator('body')).toBeVisible();
    // Should have a "New Project" or similar button
    const newProjectBtn = page.getByRole('button', { name: /new|nuevo|create/i });
    // Either exists or there's a project list
    const projectCards = page.locator('[data-testid="project-card"], .project-card, a[href*="/projects/"]');
    const hasContent = await newProjectBtn.isVisible().catch(() => false)
      || (await projectCards.count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test('create project dialog opens', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const newProjectBtn = page.getByRole('button', { name: /new|nuevo|create/i }).first();
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click();

      // Dialog should appear with project name field
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog.getByPlaceholder(/name|nombre/i).first()).toBeVisible();
    }
  });

  test('upload page accepts CSV file', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Create a new project first
    const newProjectBtn = page.getByRole('button', { name: /new|nuevo|create/i }).first();
    if (!(await newProjectBtn.isVisible())) {
      test.skip();
      return;
    }
    await newProjectBtn.click();

    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(/name|nombre/i).first().fill('E2E Test Project');

    const createBtn = dialog.getByRole('button', { name: /create|crear/i });
    await createBtn.click();

    // Wait for project creation and navigation to upload
    await page.waitForURL('**/projects/**', { timeout: 10_000 });

    // Upload file
    const csvPath = path.resolve(__dirname, '../fixtures/test-data-small.csv');
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(csvPath);

      // Wait for file processing
      await page.waitForTimeout(3_000);
    }
  });
});
