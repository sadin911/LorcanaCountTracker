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

    // Verify Market Reference row (Regular & Foil)
    await expect(modal.locator('text=Regular Market')).toBeVisible();
    await expect(modal.locator('text=✨ Foil Market')).toBeVisible();

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

  test('admin console shows OAuth protected gate', async ({ page }) => {
    await page.goto('/?admin=true');
    await page.waitForTimeout(500);

    // Verify Admin Auth Gate is shown
    await expect(page.locator('text=Illumineer Admin Access')).toBeVisible();
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });
});
