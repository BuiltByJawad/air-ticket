import { test, expect } from '@playwright/test';

function sessionCookie(value: string) {
  return {
    name: 'session_token',
    value,
    domain: 'localhost',
    path: '/'
  };
}

test.describe('Admin Reconciliation Page', () => {
  test.skip('admin can open reconciliation page', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) {
      test.skip();
      return;
    }

    await page.context().addCookies([sessionCookie(adminToken)]);
    await page.goto('/admin/reconciliation');

    await expect(page).toHaveURL(/\/admin\/reconciliation/);
    await expect(page.locator('h1:has-text("Reconciliation")')).toBeVisible();
    await expect(page.locator('text=Payment State')).toBeVisible();
    await expect(page.locator('text=Refund State')).toBeVisible();
  });

  test.skip('agent is blocked from reconciliation page', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) {
      test.skip();
      return;
    }

    await page.context().addCookies([sessionCookie(agentToken)]);
    await page.goto('/admin/reconciliation');

    // Proxy should redirect non-admin away from admin routes.
    await expect(page).not.toHaveURL(/\/admin\/reconciliation/);
  });

  test.skip('date filters update URL on apply', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) {
      test.skip();
      return;
    }

    await page.context().addCookies([sessionCookie(adminToken)]);
    await page.goto('/admin/reconciliation');

    await page.locator('input[name="fromDate"]').fill('2026-01-01');
    await page.locator('input[name="toDate"]').fill('2026-01-31');
    await page.locator('button:has-text("Filter")').click();

    await expect(page).toHaveURL(/fromDate=2026-01-01/);
    await expect(page).toHaveURL(/toDate=2026-01-31/);
  });

  test.skip('csv export endpoint responds with attachment', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN;
    if (!adminToken) {
      test.skip();
      return;
    }

    await page.context().addCookies([sessionCookie(adminToken)]);

    const response = await page.request.get('/api/reconciliation-export?fromDate=2026-01-01&toDate=2026-01-31');
    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'] ?? '';
    const disposition = response.headers()['content-disposition'] ?? '';
    expect(contentType).toContain('text/csv');
    expect(disposition.toLowerCase()).toContain('attachment');
  });
});
