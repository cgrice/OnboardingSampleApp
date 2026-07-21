// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Tenant Setup', () => {
  test('provisions the tenant to active', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Tenant Setup' }).click();

    // Tab shows the example customer
    await expect(page.locator('.placeholder h2')).toContainText('Tenant Setup');
    await expect(page.getByText('Acme Corporation')).toBeVisible();

    const setupButton = page.getByRole('button', { name: 'Set up tenant' });

    // If not already provisioned by a prior run, click to provision.
    if (await setupButton.isVisible()) {
      await setupButton.click();
    }

    // Terminal state: status is active and the action button is disabled.
    await expect(page.locator('.tenant-status')).toHaveText('active');
    await expect(page.getByRole('button', { name: 'Tenant active' })).toBeDisabled();
  });
});
