// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Import Clients', () => {
  test('imports and maps Customer A clients CSV', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Import', exact: true }).click();

    // The Import tab renders its own heading and controls.
    await expect(page.getByRole('heading', { name: 'Import Clients' })).toBeVisible();

    // Customer A should be preselected in the dropdown.
    await expect(page.locator('select')).toContainText('Customer A');

    // Upload the real sample CSV.
    const csvPath = path.resolve(
      __dirname,
      '../../sample-data/CustomerA_ABCAccounting/clients.csv'
    );
    await page.locator('input[type="file"]').setInputFiles(csvPath);

    await page.getByRole('button', { name: 'Import & Map' }).click();

    // Summary confirms 10 mapped records.
    await expect(page.locator('.import-table')).toBeVisible();
    await expect(page.getByText(/10.*record\(s\) mapped/)).toBeVisible();

    // Normalized (canonical) values appear in the table.
    const firstRow = page.locator('.import-table tbody tr').first();
    await expect(firstRow).toContainText('corporation');
    await expect(firstRow).toContainText('active');
    await expect(firstRow).toContainText('2023-01-15');

    // 10 data rows rendered.
    await expect(page.locator('.import-table tbody tr')).toHaveCount(10);
  });
});
