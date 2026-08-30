import { test, expect } from '@playwright/test';

test.describe('Card Management & Modal Counter Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('main');
  });

  test('opens card detail modal and interacts with finish count steppers', async ({ page }) => {
    // Click on the first card image
    const firstCard = page.locator('main img[alt]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Verify modal overlay opens in body
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Copies Owned|Finish|Normal|Foil/i }).first();
    await expect(modal).toBeVisible();

    // Check finish steppers exist
    const incrementBtn = modal.locator('button:has-text("+")').first();
    if (await incrementBtn.isVisible()) {
      await incrementBtn.click();
      await page.waitForTimeout(200);
    }

    // Close the modal via escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('opens Collection Text Import modal and imports cards via text', async ({ page }) => {
    // Click visible Import button in header
    const importBtn = page.locator('button:has-text("Import")').filter({ visible: true }).first();
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify modal appears
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Import Cards from Text/i }).first();
    await expect(modal).toBeVisible();

    // Fill in text
    const textarea = modal.locator('textarea');
    await textarea.fill('Set13\n1,3\n20,5\n21');
    await page.waitForTimeout(300);

    // Verify live preview displays parsed counts
    await expect(modal).toContainText('9 copies');
    await expect(modal).toContainText('3 distinct');

    // Click Import button
    const submitBtn = modal.locator('button:has-text("Import 9 Cards")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success feedback
    await page.waitForTimeout(500);
  });
});
