import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/survey genius|talk2data/i);
  });

  test('unauthenticated user is redirected to auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/auth**', { timeout: 10_000 });
    await expect(page.url()).toContain('/auth');
  });

  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Should have email and password fields
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('health check API responds', async ({ request }) => {
    const apiUrl = process.env.API_URL || 'https://talk2data-production-1698.up.railway.app';
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toMatch(/healthy|degraded/);
  });
});
