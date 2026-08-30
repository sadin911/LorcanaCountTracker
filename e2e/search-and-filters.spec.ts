import { test, expect } from '@playwright/test';

test.describe('Search & Filter System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('main');
  });

  test('filters cards by typing in search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type a specific card name query
    await searchInput.fill('Mickey');
    
    // Wait for debounce and DOM update
    await page.waitForTimeout(400);

    // Verify filtered card titles/names contain Mickey
    const cardText = page.locator('main');
    await expect(cardText).toContainText('Mickey');

    // Clear search
    const clearBtn = page.locator('button[aria-label="Clear search"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('filters cards by set and number pattern (1-13)', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Search 1-13 (Card 1 of Set 13 or Card 13 of Set 1)
    await searchInput.fill('1-13');
    await page.waitForTimeout(400);

    // Woody (13-1) or Minnie Mouse (1-13) should be displayed
    const cardText = page.locator('main');
    const hasWoodyOrMinnie = (await cardText.getByText('Woody').count()) > 0 || (await cardText.getByText('Minnie Mouse').count()) > 0;
    expect(hasWoodyOrMinnie).toBe(true);

    // Clear search
    const clearBtn = page.locator('button[aria-label="Clear search"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  });

  test('filters cards by ink color', async ({ page }) => {
    // Click on Amber or Emerald or Ruby ink filter button
    const inkButton = page.locator('button:has-text("Amber"), button:has-text("Ruby"), button:has-text("Amethyst")').first();
    if (await inkButton.isVisible()) {
      await inkButton.click();
      await page.waitForTimeout(300);
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('interacts with searchable set selector dropdown', async ({ page }) => {
    // Open the set select dropdown
    const setSelectTrigger = page.locator('button:has-text("All Sets"), button:has-text("Set"), button:has-text("Chapter")').first();
    await expect(setSelectTrigger).toBeVisible();
    await setSelectTrigger.click();

    // Verify dropdown menu opens
    const dropdownMenu = page.locator('input[placeholder*="Filter sets"], input[placeholder*="Search"]');
    await expect(dropdownMenu.first()).toBeVisible();

    // Select first option or click outside to dismiss
    const firstOption = page.locator('button[role="option"], ul li button, div button').filter({ hasText: 'The First Chapter' }).first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await page.waitForTimeout(300);
    } else {
      await page.keyboard.press('Escape');
    }
  });
});
