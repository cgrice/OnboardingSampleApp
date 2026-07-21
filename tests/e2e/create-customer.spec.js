// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Create a new customer', () => {
  test('adds a new customer to the onboarding queue', async ({ page }) => {
    await page.goto('/');

    // Wait for the initial queue to load
    await expect(page.locator('.customer-card').first()).toBeVisible();

    // Use a unique name so the test is independent of existing data
    const name = `Test Customer ${Date.now()}`;

    await page.getByRole('button', { name: '+ New Customer' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save' }).click();

    // The new customer's card should appear in the queue
    await expect(page.locator('.customer-card h3', { hasText: name })).toBeVisible();
  });

  test('shows an error when name is empty', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.customer-card').first()).toBeVisible();

    await page.getByRole('button', { name: '+ New Customer' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
