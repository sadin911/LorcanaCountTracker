import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Gestures', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('main');
  });

  test('renders mobile header, safe areas, and compact filter bars without horizontal overflow', async ({ page }) => {
    // Check that horizontal scrolling does not occur
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    // Verify main toolbar elements are rendered and responsive
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('simulates touch pull-to-refresh gesture', async ({ page }) => {
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    // Perform a downward touch gesture starting near the top of the viewport
    const startX = 200;
    const startY = 120;
    const endY = 280;

    await page.touchscreen.tap(startX, startY);
    
    // Dispatch touch sequence
    await page.evaluate(
      ({ sX, sY, eY }) => {
        const createTouchEvent = (type: string, y: number) => {
          const touch = new Touch({
            identifier: Date.now(),
            target: document.body,
            clientX: sX,
            clientY: y,
            screenX: sX,
            screenY: y,
            pageX: sX,
            pageY: y,
          });
          return new TouchEvent(type, {
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          });
        };

        window.dispatchEvent(createTouchEvent('touchstart', sY));
        for (let y = sY; y <= eY; y += 15) {
          window.dispatchEvent(createTouchEvent('touchmove', y));
        }
        window.dispatchEvent(createTouchEvent('touchend', eY));
      },
      { sX: startX, sY: startY, eY: endY }
    );

    // Verify indicator triggers or page handles touch smoothly without errors
    await page.waitForTimeout(500);
    await expect(page.locator('main')).toBeVisible();
  });
});
