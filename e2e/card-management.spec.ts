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

  test('opens Collection Import modal and imports cards via text', async ({ page }) => {
    // Click visible Import button in header
    const importBtn = page.locator('button:has-text("Import")').filter({ visible: true }).first();
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify modal appears
    const modal = page.locator('[data-testid="collection-import-modal"]').first();
    await expect(modal).toBeVisible();

    // Switch to Text tab if on Voice tab
    const textTab = modal.locator('[data-testid="text-tab-button"]');
    if (await textTab.isVisible()) {
      await textTab.click();
    }

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

  test('voice card input: opens voice tab, simulates speech dictation, stages card, and manages quantities', async ({ page }) => {
    // 1. Open Voice collector directly via header voice button or import button
    const voiceBtn = page.locator('[data-testid="voice-import-button"]');
    if (await voiceBtn.isVisible()) {
      await voiceBtn.click();
    } else {
      await page.locator('button:has-text("Import")').filter({ visible: true }).first().click();
    }

    // 2. Collection import modal opens directly on Voice tab
    const modal = page.locator('[data-testid="collection-import-modal"]');
    await expect(modal).toBeVisible();
    const voiceTab = modal.locator('[data-testid="voice-tab-button"]');
    await expect(voiceTab).toBeVisible();

    // Verify main mic button, TTS toggle, and speech guide exist
    const micButton = modal.locator('[data-testid="voice-record-button"]');
    await expect(micButton).toBeVisible();

    const ttsToggleBtn = modal.locator('[data-testid="voice-tts-toggle-button"]');
    if (await ttsToggleBtn.isVisible()) {
      await expect(ttsToggleBtn).toContainText('TTS On');
      await ttsToggleBtn.click();
      await expect(ttsToggleBtn).toContainText('TTS Off');
      await ttsToggleBtn.click();
      await expect(ttsToggleBtn).toContainText('TTS On');
    }

    await expect(modal.locator('text=Quick Voice Examples')).toBeVisible();

    // 3. Click suggestion chip to simulate speech input: "ชุด 1 เบอร์ 25 สองใบ"
    const sampleChip = modal.locator('button:has-text("ชุด 1 เบอร์ 25 สองใบ")');
    await expect(sampleChip).toBeVisible();
    await sampleChip.click();

    // 4. Verify card is added into staged cards list
    await expect(modal.locator('text=Staged Cards')).toBeVisible();
    await expect(modal.locator('text=2 cards (1 distinct)')).toBeVisible();

    // 5. Test quantity stepper (+1)
    const plusBtn = modal.locator('button:has-text("+")').first();
    await plusBtn.click();
    await expect(modal.locator('text=3 cards (1 distinct)')).toBeVisible();

    // 6. Test copy as text
    const copyAsTextBtn = modal.locator('button:has-text("Copy as Text")');
    await expect(copyAsTextBtn).toBeVisible();
    await copyAsTextBtn.click();

    // Text tab should open with copied cards
    const textTab = modal.locator('[data-testid="text-tab-button"]');
    await expect(textTab).toBeVisible();
    const textarea = modal.locator('textarea');
    await expect(textarea).toHaveValue(/Set1/i);
    await expect(textarea).toHaveValue(/25,3/);
  });
});
