import { expect, test } from '@playwright/test';
import { ALL_CARDS, openApp } from './helpers';

test('the catalogue loads and the grid renders cards', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('button[title="All Cards"], button:has-text("🎴")').first()).toBeVisible();
  // The count badge should report the whole catalogue with no filters applied.
  await expect(page.getByText(ALL_CARDS.length.toLocaleString(), { exact: true })).toBeVisible();
});
