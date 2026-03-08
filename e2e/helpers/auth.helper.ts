import { Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@talk2data.survey-genius.ai';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';

/**
 * Login with email/password via the auth page.
 * Waits for redirect to /dashboard after successful login.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Click "Sign In" tab if visible (the auth page may default to sign-up)
  const signInTab = page.getByRole('tab', { name: /sign in|iniciar sesión/i });
  if (await signInTab.isVisible()) {
    await signInTab.click();
  }

  // Fill email and password
  await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(/password|contraseña/i).fill(TEST_PASSWORD);

  // Submit
  await page.getByRole('button', { name: /sign in|iniciar sesión|log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Ensure the user is authenticated by checking for dashboard access.
 * If not on dashboard, performs login.
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  await page.goto('/dashboard');
  const url = page.url();
  if (url.includes('/auth') || url.includes('/login')) {
    await login(page);
  }
}
