import { test, expect } from '@playwright/test';
import { openApp } from './helpers';

test.describe('Card Pricing & Valuation System', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('displays market price, user custom prices, and currency switcher in card modal', async ({ page }) => {
    // Open first card modal
    const firstCard = page.locator('main img[alt]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Verify modal and pricing section
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Market Price & Valuation/i }).first();
    await expect(modal).toBeVisible();

    // Verify Market Reference row (Regular, Foil & PSA 10)
    await expect(modal.getByText('Regular', { exact: true })).toBeVisible();
    await expect(modal.getByText('✨ Foil', { exact: true })).toBeVisible();
    await expect(modal.getByText('🏆 PSA 10', { exact: true })).toBeVisible();

    // Currency Switcher buttons
    const thbBtn = modal.locator('button:has-text("THB")');
    const usdBtn = modal.locator('button:has-text("USD")');
    await expect(thbBtn).toBeVisible();
    await expect(usdBtn).toBeVisible();

    // Switch to USD
    await usdBtn.click();
    await page.waitForTimeout(100);

    // Switch back to THB
    await thbBtn.click();
    await page.waitForTimeout(100);

    // Input custom purchase cost and target sell price
    const costInput = modal.locator('input[placeholder="e.g. 150"]');
    const sellInput = modal.locator('input[placeholder="e.g. 300"]');
    await expect(costInput).toBeVisible();
    await expect(sellInput).toBeVisible();

    await costInput.fill('120');
    await sellInput.fill('250');

    // Close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Reopen modal to verify user custom pricing persistence
    await firstCard.click();
    const reopenedModal = page.locator('.fixed.inset-0').filter({ hasText: /Market Price & Valuation/i }).first();
    await expect(reopenedModal).toBeVisible();
    await expect(reopenedModal.locator('input[placeholder="e.g. 150"]')).toHaveValue('120');
    await expect(reopenedModal.locator('input[placeholder="e.g. 300"]')).toHaveValue('250');
  });

  test('deck editor displays deck market value badge with currency toggle', async ({ page }) => {
    // Switch to Deck Builder via BottomNav / header button
    const deckNavBtn = page.locator('nav button:has-text("Decks"), button:has-text("Decks"):visible').first();
    await expect(deckNavBtn).toBeVisible();
    await deckNavBtn.click();

    // Verify Deck Manager loaded
    await expect(page.getByText('Your Deck Vault')).toBeVisible();

    // Create a new deck
    const createBtn = page.locator('button:has-text("Create New Deck")').first();
    await createBtn.click();

    const nameInput = page.locator('input[placeholder*="Ruby & Amethyst"]');
    await nameInput.fill('Pricing Test Deck');
    await page.getByRole('button', { name: 'Create Deck', exact: true }).click();

    // Verify Deck Market Value badge exists in Deck Editor
    const valueBadge = page.locator('text=Value').first();
    await expect(valueBadge).toBeVisible();
  });

  test('header currency selector switches active currency across app', async ({ page }) => {
    // Check currency button in header (matching visible button on desktop or mobile)
    const currencyBtn = page.locator('header button:visible:has-text("THB"), header button:visible:has-text("USD"), header button:visible:has-text("💱")').first();
    await expect(currencyBtn).toBeVisible();
    await currencyBtn.click();

    // If dropdown appeared, pick USD
    const usdOption = page.locator('button:visible:has-text("USD")').first();
    if (await usdOption.isVisible()) {
      await usdOption.click();
    }

    // Open card modal and verify currency reflects USD
    const firstCard = page.locator('main img[alt]').first();
    await firstCard.click();
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Market Price & Valuation/i }).first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=USD ($)')).toBeVisible();
  });

  test('displays price badges on card grid and allows sorting by market price', async ({ page }) => {
    // Check for price badge on card grid items
    const priceBadges = page.locator('[data-testid="card-tile"] .font-mono:has-text("฿"), [data-testid="card-tile"] .font-mono:has-text("$")');
    await expect(priceBadges.first()).toBeVisible();

    // Select Sort By: Market Price
    const sortSelect = page.locator('select[aria-label="Sort cards by"]:visible');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price');
    }

    // Verify sort option price is selected
    await expect(sortSelect).toHaveValue('price');

    // Toggle sort order button
    const sortOrderBtn = page.locator('button[title*="Sort Order"]:visible').first();
    if (await sortOrderBtn.isVisible()) {
      await sortOrderBtn.click();
      await page.waitForTimeout(200);
      await sortOrderBtn.click();
    }
  });
});
