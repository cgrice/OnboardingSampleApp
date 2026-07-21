// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Tenant Setup', () => {
  test('provisions the tenant to active', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Tenant Setup' }).click();

    // Tab defaults to the first customer (the example customer)
    await expect(page.locator('.placeholder h2')).toContainText('Tenant Setup');
    await expect(page.getByLabel('Customer')).toHaveValue('cust_001');
    await expect(page.locator('strong').filter({ hasText: 'Acme Corporation' })).toBeVisible();

    const setupButton = page.getByRole('button', { name: 'Set up tenant' });

    // If not already provisioned by a prior run, click to provision.
    if (await setupButton.isVisible()) {
      await setupButton.click();
    }

    // Terminal state: status is active and the action button is disabled.
    await expect(page.locator('.tenant-status')).toHaveText('active');
    await expect(page.getByRole('button', { name: 'Tenant active' })).toBeDisabled();
  });

  test('lets you pick a different customer to provision', async ({ page }) => {
    // Create a fresh customer so there is more than one to choose from.
    const name = `Pickable Co ${Date.now()}`;
    await page.goto('/');
    await page.getByRole('button', { name: '+ New Customer' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByRole('button', { name: 'Tenant Setup' }).click();

    // Select the newly created customer from the picker.
    await page.getByLabel('Customer').selectOption({ label: name });
    await expect(page.locator('strong').filter({ hasText: name })).toBeVisible();

    // A brand-new customer's tenant is pending and can be provisioned.
    const setupButton = page.getByRole('button', { name: 'Set up tenant' });
    await expect(setupButton).toBeEnabled();
    await setupButton.click();

    await expect(page.locator('.tenant-status')).toHaveText('active');
  });
});
