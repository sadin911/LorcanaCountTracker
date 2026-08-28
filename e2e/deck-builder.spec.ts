import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('Deck Builder allows creating, viewing stats, and calculating missing cards', async ({ page }) => {
  await openApp(page);

  // Switch to Deck Builder via BottomNav
  const deckNavBtn = page.locator('button:has-text("จัดเด็ค")').first();
  await expect(deckNavBtn).toBeVisible();
  await deckNavBtn.click();

  // Verify Deck Manager page loaded
  await expect(page.getByText('คลังเด็คการ์ดของคุณ')).toBeVisible();

  // Click create new deck
  const createBtn = page.locator('button:has-text("สร้างเด็คใหม่")').first();
  await createBtn.click();

  // Fill in deck modal
  const nameInput = page.locator('input[placeholder*="Ruby & Amethyst"]');
  await nameInput.fill('Test Steelsongs');
  await page.getByRole('button', { name: 'สร้างเด็ค', exact: true }).click();

  // Verify Deck Editor is active
  await expect(page.locator('h1:has-text("Test Steelsongs")')).toBeVisible();
  await expect(page.getByText('0 / 60')).toBeVisible();

  // If on mobile layout, switch to catalog tab
  const catalogTab = page.locator('button:has-text("ค้นหาการ์ด")');
  if (await catalogTab.isVisible()) {
    await catalogTab.click();
  }

  // Add 1 card from catalog
  const plusOneBtns = page.locator('button:has-text("+1")');
  await expect(plusOneBtns.first()).toBeVisible();
  await plusOneBtns.first().click();

  // Verify card count updated to 1 / 60
  await expect(page.getByText('1 / 60')).toBeVisible();

  // Open Missing Cards Modal
  const missingBtn = page.locator('button:has-text("เทียบสมุดสะสม")');
  await missingBtn.click();

  // Verify missing cards modal
  await expect(page.getByText('ตรวจสอบการ์ดที่ขาด (Missing Cards)')).toBeVisible();
  await expect(page.getByText('คัดลอก Shopping List')).toBeVisible();

  // Close modal
  await page.locator('button:has-text("✕")').first().click();

  // Return to deck list
  await page.locator('button:has-text("คลังเด็ค")').click();
  await expect(page.getByText('คลังเด็คการ์ดของคุณ')).toBeVisible();
});
