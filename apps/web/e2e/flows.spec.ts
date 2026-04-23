import { test, expect } from '@playwright/test';

// These tests verify core user flows.
// They require both the API and Web servers running.
// Run: pnpm --filter @air-ticket/web exec playwright test

test.describe('Login Flow', () => {
  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2, h3, [data-testid="login-title"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    await emailInput.fill('nonexistent@test.com');
    await passwordInput.fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/error=invalid_credentials/);
  });

  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Register Flow', () => {
  test('shows register page at /register', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});

test.describe('Public Pages', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });
});

test.describe('Admin Agency CRUD', () => {
  // These tests require an admin session cookie.
  test.skip('admin can view agencies list', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/agencies');
    await expect(page).toHaveURL(/\/admin\/agencies/);
    await expect(page.locator('table, [data-testid="agencies-list"]')).toBeVisible();
  });

  test.skip('admin can create agency', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/agencies');
    // Open create dialog
    await page.locator('button:has-text("Create"), button:has-text("Add")').first().click();
    await page.locator('input[name="name"], input[placeholder*="agency"]').fill('E2E Test Agency');
    await page.locator('button:has-text("Create"), button:has-text("Submit")').last().click();
    await expect(page.locator('text=E2E Test Agency')).toBeVisible();
  });

  test.skip('admin can view agency detail', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/agencies');
    // Click first agency link
    await page.locator('a[href^="/admin/agencies/"]').first().click();
    await expect(page).toHaveURL(/\/admin\/agencies\/.+/);
    await expect(page.locator('text=Agents, text=Bookings')).toBeVisible();
  });
});

test.describe('Admin User Management', () => {
  test.skip('admin can view users list', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('table, [data-testid="users-list"]')).toBeVisible();
  });

  test.skip('admin can view user detail with role change', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/users');
    await page.locator('a[href^="/admin/users/"]').first().click();
    await expect(page).toHaveURL(/\/admin\/users\/.+/);
    // Role change button should be visible
    await expect(page.locator('button:has-text("Change Role"), button:has-text("Role")')).toBeVisible();
  });
});

test.describe('Admin Bookings', () => {
  test.skip('admin can view all bookings', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/bookings');
    await expect(page).toHaveURL(/\/admin\/bookings/);
  });
});

test.describe('Admin Audit Logs', () => {
  test.skip('admin can view audit logs', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/\/admin\/audit/);
    await expect(page.locator('table, [data-testid="audit-list"]')).toBeVisible();
  });
});

test.describe('Agent Booking Flow', () => {
  test.skip('agent can view bookings list', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: agentToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/bookings/);
  });

  test.skip('agent can access flight search', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: agentToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/flights');
    await expect(page).toHaveURL(/\/flights/);
    await expect(page.locator('input[name="origin"], input[placeholder*="Origin"]')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('icon buttons have aria-labels on login page', async ({ page }) => {
    await page.goto('/login');
    const iconButtons = page.locator('button[size="icon"], button:has(svg):not(:has-text))');
    const count = await iconButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(iconButtons.nth(i)).toHaveAttribute('aria-label', /.+/);
    }
  });

  test('mobile menu button has aria-label', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin');
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 812 });
    const menuButton = page.locator('button[aria-label="Open menu"], button[aria-label="Close menu"]');
    await expect(menuButton).toBeVisible();
  });
});
