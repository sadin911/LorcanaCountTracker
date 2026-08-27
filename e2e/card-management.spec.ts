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
});
