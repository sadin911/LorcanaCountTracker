import type { Page } from '@playwright/test';
/* Read through the filesystem rather than `import ... from '*.json'`: Playwright
   runs these as ESM, where a JSON import needs an import attribute that the
   TypeScript the app is built with does not emit. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const readData = <T>(file: string): T => JSON.parse(readFileSync(join(dataDir, file), 'utf-8')) as T;

export interface Card {
  id: string;
  name: string;
  version: string | null;
  setCode: string;
  setName: string;
  collectorNumber: string;
  story: string;
  rarity: string;
  types: string[];
}

export const ALL_CARDS = readData<Card[]>('lorcanaCards.json');
export const ALL_STORIES = readData<{ name: string; cardCount: number }[]>('lorcanaStories.json');

/** The three tiers Lorcana prints foil-only, which are the ones that get the sheen. */
export const PREMIUM_RARITIES = ['Enchanted', 'Epic', 'Iconic'];

const normalize = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Expected counts are derived from the catalogue, never hardcoded. */
export const countInStory = (story: string) => ALL_CARDS.filter((c) => c.story === story).length;
export const countWithName = (name: string) =>
  ALL_CARDS.filter((c) => normalize(c.name) === normalize(name)).length;
export const cardsInSet = (setCode: string) => ALL_CARDS.filter((c) => c.setCode === setCode);
export const premiumCards = () => ALL_CARDS.filter((c) => PREMIUM_RARITIES.includes(c.rarity));

/**
 * Filters persist to localStorage, so every test starts from a known state
 * rather than inheriting whatever the previous one left behind.
 */
export async function openApp(page: Page, filters: Record<string, unknown> = {}) {
  await page.addInitScript((f) => {
    window.localStorage.setItem(
      'lorcana_collection_filters_v1',
      JSON.stringify({ showFullColor: true, ...(f as object) })
    );
  }, filters);
  await page.goto('/');
  await page.waitForSelector('main');
  await page.locator('button[title="All Cards"], button:has-text("🎴")').first().waitFor();
}

/** The badge that reports how many cards survive the current filters. */
export async function visibleCardCount(page: Page): Promise<number> {
  const raw = await page.getByTestId('result-count').getAttribute('data-count');
  return Number(raw);
}

/** Wait for the count badge to settle on a value — search is debounced. */
export async function expectCardCount(page: Page, expected: number) {
  await page
    .getByTestId('result-count')
    .and(page.locator(`[data-count="${expected}"]`))
    .waitFor({ timeout: 10_000 });
}

/** A premium card that is also a Character, so both related strips have content. */
export function premiumCharacterWithRelatives(): Card {
  const withStory = (story: string) => ALL_CARDS.filter((c) => c.story === story).length;
  return premiumCards().find(
    (c) =>
      c.types.includes('Character') &&
      countWithName(c.name) > 1 &&
      withStory(c.story) > 1
  )!;
}

/** Read a CSS custom property off an element. */
export function cssVar(page: Page, selector: string, name: string) {
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel as string);
      return el ? getComputedStyle(el).getPropertyValue(prop as string).trim() : null;
    },
    [selector, name]
  );
}

/**
 * Dispatch a real DeviceOrientationEvent sequence. The gyro path is absolute:
 * the first reading is swallowed as the neutral baseline, so callers send that
 * first and then the lean they want.
 */
export async function tiltDevice(page: Page, readings: { beta: number; gamma: number }[]) {
  await page.evaluate((rs) => {
    for (const r of rs as { beta: number; gamma: number }[]) {
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: r.beta,
          gamma: r.gamma,
          absolute: true,
        })
      );
    }
  }, readings);
}
