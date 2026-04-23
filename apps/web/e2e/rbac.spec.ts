import { test, expect } from '@playwright/test';

// These tests verify the proxy (middleware) RBAC enforcement.
// They require both the API and Web servers running.
// Run: pnpm --filter @air-ticket/web exec playwright test

test.describe('RBAC Route Enforcement', () => {
  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access /flights', async ({ page }) => {
    await page.goto('/flights');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access /bookings', async ({ page }) => {
    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Agent Role Access', () => {
  // Note: These tests require a valid agent session cookie.
  // Set E2E_AGENT_TOKEN and E2E_ADMIN_TOKEN env vars for authenticated tests.

  test.skip('agent can access /dashboard', async ({ page }) => {
    // Set agent session cookie before navigation
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: agentToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.skip('agent can access /flights', async ({ page }) => {
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
  });

  test.skip('agent is redirected from /admin to /dashboard', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: agentToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Admin Role Access', () => {
  test.skip('admin can access /admin', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test.skip('admin is redirected from /dashboard to /admin', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/admin/);
  });

  test.skip('admin is redirected from /flights to /admin', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/flights');
    await expect(page).toHaveURL(/\/admin/);
  });

  test.skip('admin is redirected from /bookings list to /admin/bookings', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: adminToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/admin\/bookings/);
  });
});

test.describe('Shared Routes', () => {
  test.skip('both roles can access /profile', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();

    await page.context().addCookies([{
      name: 'session_token',
      value: agentToken!,
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });
});
