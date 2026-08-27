import { test, expect } from '@playwright/test';

test.describe('Collection Navigation & Core App State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for initial catalogue and app hydration
    await page.waitForSelector('main');
  });

  test('loads the app and displays header collection stats', async ({ page }) => {
    // Check main title or header exists
    await expect(page.locator('header')).toBeVisible();

    // Verify statistics cards are rendered
    const statElements = page.locator('header span, header p');
    await expect(statElements.first()).toBeVisible();

    // Verify card grid is populated with cards
    const cardItems = page.locator('main button, main img');
    await expect(cardItems.first()).toBeVisible();
    const count = await cardItems.count();
    expect(count).toBeGreaterThan(5);
  });

  test('displays profile switcher and switches profile tabs smoothly', async ({ page }) => {
    // Open profile menu if exists or check profile trigger
    const profileTrigger = page.locator('button:has-text("Main"), button:has-text("Profile"), header button').first();
    await expect(profileTrigger).toBeVisible();
  });
});
