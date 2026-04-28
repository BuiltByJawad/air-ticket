import { test, expect } from '@playwright/test';

// E2E tests for the profile update flow.
// Requires E2E_AGENT_TOKEN or E2E_ADMIN_TOKEN env var.
// Run: pnpm --filter @air-ticket/web exec playwright test e2e/profile-update.spec.ts

function setSessionCookie(page: import('@playwright/test').Page, token: string) {
  return page.context().addCookies([{
    name: 'session_token',
    value: token,
    domain: 'localhost',
    path: '/'
  }]);
}

test.describe('Profile Page', () => {
  test('unauthenticated user is redirected from /profile to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip('authenticated user can view profile page', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
  });

  test.skip('profile page displays user info cards', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');
    // Should show Full Name, Email, Phone, Role cards
    await expect(page.locator('text=Full Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Phone')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
  });

  test.skip('profile edit form is visible', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');
    await expect(page.locator('text=Edit Profile')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });

  test.skip('user can update name and phone', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');

    // Clear and update name
    const nameInput = page.locator('#name');
    await nameInput.clear();
    await nameInput.fill('E2E Test User');

    // Clear and update phone
    const phoneInput = page.locator('#phone');
    await phoneInput.clear();
    await phoneInput.fill('+1 555 000 0000');

    // Submit
    await page.locator('button[type="submit"]:has-text("Save")').click();

    // Should show success toast
    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 });
  });

  test.skip('password change requires current password', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');

    // Fill new password without current password
    await page.locator('#password').fill('newpassword123');
    await page.locator('#confirmPassword').fill('newpassword123');

    // Submit
    await page.locator('button[type="submit"]:has-text("Save")').click();

    // Should show validation error
    await expect(page.locator('text=Current password is required')).toBeVisible();
  });

  test.skip('password mismatch shows error', async ({ page }) => {
    const token = process.env.E2E_AGENT_TOKEN || process.env.E2E_ADMIN_TOKEN;
    if (!token) test.skip();
    await setSessionCookie(page, token!);

    await page.goto('/profile');

    // Fill passwords that don't match
    await page.locator('#currentPassword').fill('oldpassword');
    await page.locator('#password').fill('newpassword123');
    await page.locator('#confirmPassword').fill('differentpassword');

    // Submit
    await page.locator('button[type="submit"]:has-text("Save")').click();

    // Should show validation error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
