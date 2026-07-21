// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Import Contacts', () => {
  test('imports and maps Customer A contacts CSV', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Import' }).click();

    // Switch the import type from Clients to Contacts.
    await page.getByRole('combobox').first().selectOption('contacts');
    await expect(page.getByRole('heading', { name: 'Import Contacts' })).toBeVisible();

    // Customer A should be preselected in the customer dropdown.
    await expect(page.getByRole('combobox').nth(1)).toContainText('Customer A');

    // Upload the real sample CSV.
    const csvPath = path.resolve(
      __dirname,
      '../../sample-data/CustomerA_ABCAccounting/contacts.csv'
    );
    await page.locator('input[type="file"]').setInputFiles(csvPath);

    await page.getByRole('button', { name: 'Import & Map' }).click();

    // Summary confirms 15 mapped records.
    await expect(page.locator('.import-table')).toBeVisible();
    await expect(page.getByText(/15.*record\(s\) mapped/)).toBeVisible();

    // Normalized (canonical) values appear in the first row.
    const firstRow = page.locator('.import-table tbody tr').first();
    await expect(firstRow).toContainText('C001');
    await expect(firstRow).toContainText('active');
    await expect(firstRow).toContainText('email');

    // 15 data rows rendered.
    await expect(page.locator('.import-table tbody tr')).toHaveCount(15);
  });
});
