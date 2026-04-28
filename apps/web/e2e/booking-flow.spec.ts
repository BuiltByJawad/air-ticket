import { test, expect } from '@playwright/test';

// E2E tests for the flight search and booking flow.
// Requires E2E_AGENT_TOKEN env var for authenticated tests.
// Run: pnpm --filter @air-ticket/web exec playwright test e2e/booking-flow.spec.ts

function setAgentCookie(page: import('@playwright/test').Page, token: string) {
  return page.context().addCookies([{
    name: 'session_token',
    value: token,
    domain: 'localhost',
    path: '/'
  }]);
}

test.describe('Flight Search Flow', () => {
  test('unauthenticated user is redirected from /flights to /login', async ({ page }) => {
    await page.goto('/flights');
    await expect(page).toHaveURL(/\/login/);
  });

  test.skip('agent can view flight search page', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/flights');
    await expect(page).toHaveURL(/\/flights/);
    await expect(page.locator('h1:has-text("Search Flights")')).toBeVisible();
  });

  test.skip('agent can toggle trip type', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/flights');
    // Default is one-way — round-trip button should be visible
    await page.locator('button:has-text("Round-trip")').click();
    // Return date field should appear
    await expect(page.locator('#returnDate, [data-testid="returnDate"]')).toBeVisible();
    // Switch back to one-way
    await page.locator('button:has-text("One-way")').click();
    await expect(page.locator('#returnDate, [data-testid="returnDate"]')).not.toBeVisible();
  });

  test.skip('agent can swap origin and destination', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/flights');
    // Type into origin field
    const originInput = page.locator('#origin');
    await originInput.fill('JFK');
    const destInput = page.locator('#destination');
    await destInput.fill('LAX');

    // Click swap button
    await page.locator('button:has(svg.lucide-arrow-right-left), button >> xpath=//svg[contains(@class,"lucide-arrow-right-left")]/..').first().click();

    // Values should be swapped
    await expect(page.locator('#origin')).toHaveValue('LAX');
    await expect(page.locator('#destination')).toHaveValue('JFK');
  });

  test.skip('agent sees validation errors on empty search', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/flights');
    await page.locator('button[type="submit"]:has-text("Search")').click();
    // Should show validation errors
    await expect(page.locator('text=Select a departure airport, text=Select a departure date')).toBeVisible();
  });

  test.skip('agent can search flights and see results or no-results message', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/flights');

    // Fill search form
    await page.locator('#origin').fill('JFK');
    await page.locator('#destination').fill('LAX');

    // Open date picker and select a date
    await page.locator('#departureDate').click();
    // Pick a day in the calendar (any enabled button)
    const dayButton = page.locator('[role="dialog"] button:not([disabled])').first();
    if (await dayButton.isVisible()) {
      await dayButton.click();
    }

    await page.locator('button[type="submit"]:has-text("Search")').click();

    // Should either show results or "No flights found" message
    await expect(
      page.locator('text=No flights found, [data-testid="flight-offer"]').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Booking Flow', () => {
  test.skip('agent can view bookings list', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.locator('h1:has-text("Bookings")')).toBeVisible();
  });

  test.skip('agent can filter bookings by status', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/bookings');
    // Click "confirmed" filter
    await page.locator('a:has-text("confirmed")').click();
    await expect(page).toHaveURL(/status=confirmed/);
  });

  test.skip('agent can navigate to booking detail', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/bookings');
    // If there are bookings, click the first one
    const bookingLink = page.locator('a[href^="/bookings/"]').first();
    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      await expect(page).toHaveURL(/\/bookings\/.+/);
    }
  });

  test.skip('agent can navigate from bookings to flight search', async ({ page }) => {
    const agentToken = process.env.E2E_AGENT_TOKEN;
    if (!agentToken) test.skip();
    await setAgentCookie(page, agentToken!);

    await page.goto('/bookings');
    await page.locator('a:has-text("New Search")').click();
    await expect(page).toHaveURL(/\/flights/);
  });
});
