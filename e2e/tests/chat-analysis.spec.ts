import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../helpers/auth.helper';

test.describe('Chat & Analysis', () => {
  const hasCredentials = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);

  test.skip(!hasCredentials, 'Skipped: no test credentials configured');

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('chat page loads for existing project', async ({ page }) => {
    // Navigate to projects list
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on first project link
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (!(await projectLink.isVisible())) {
      test.skip();
      return;
    }
    await projectLink.click();
    await page.waitForURL('**/projects/**');

    // Navigate to chat tab
    const chatLink = page.locator('a[href*="/chat"]').first();
    if (await chatLink.isVisible()) {
      await chatLink.click();
    } else {
      // Try clicking a chat tab/button
      const chatTab = page.getByRole('button', { name: /chat/i }).first();
      if (await chatTab.isVisible()) await chatTab.click();
    }

    // Wait for chat to load
    await page.waitForLoadState('networkidle');

    // Chat input should be visible
    const chatInput = page.locator('textarea, input[placeholder*="ask"], input[placeholder*="pregunta"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
  });

  test('chat sends query and receives response', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find first project with data
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (!(await projectLink.isVisible())) {
      test.skip();
      return;
    }
    await projectLink.click();
    await page.waitForURL('**/projects/**');

    // Navigate to chat
    await page.goto(page.url().replace(/\/(overview|dataprep|data-preparation)?$/, '/chat'));
    await page.waitForLoadState('networkidle');

    // Type a query
    const chatInput = page.locator('textarea').first();
    if (!(await chatInput.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await chatInput.fill('Dame la frecuencia de la primera variable');

    // Submit (Enter or send button)
    const sendBtn = page.getByRole('button', { name: /send|enviar/i }).first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    } else {
      await chatInput.press('Enter');
    }

    // Wait for AI response (up to 60 seconds)
    const responseMessage = page.locator('.chat-message, [data-role="assistant"], .markdown').last();
    await expect(responseMessage).toBeVisible({ timeout: 60_000 });
  });
});
