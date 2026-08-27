/**
 * The one place the static catalogue JSON is imported. Everything downstream —
 * the grid, the filters, the relation index, the card modal — reads it from
 * here, so the derived order map and classification list exist once rather than
 * once per consumer.
 *
 * These are static imports on purpose: the app never fetches its catalogue at
 * runtime.
 */
import cardData from './lorcanaCards.json';
import setData from './lorcanaSets.json';
import storyData from './lorcanaStories.json';
import type { LorcanaCard, LorcanaSet, LorcanaStory } from '../types/card';

export const ALL_CARDS = cardData as LorcanaCard[];
export const ALL_SETS = setData as LorcanaSet[];

/** Most cards first, as written by scripts/fetch-lorcana-cards.mjs. */
export const ALL_STORIES = storyData as LorcanaStory[];

/** Set order follows lorcanaSets.json (release order), not alphabetical codes. */
export const SET_ORDER = new Map(ALL_SETS.map((s, i) => [s.code, i]));

/**
 * Sets newest release first — the order the set filter lists them in, because a
 * collector is nearly always working on whatever just came out. Card sorting
 * still runs on SET_ORDER (release ascending); these are different questions and
 * must not share one ordering.
 *
 * Same-day ties put the numbered expansion ahead of the promo set that shipped
 * with it, highest number first.
 */
const isNumberedSet = (code: string) => /^\d+$/.test(code);

export const SETS_NEWEST_FIRST: LorcanaSet[] = [...ALL_SETS].sort((a, b) => {
  const byDate = (b.releasedAt ?? '').localeCompare(a.releasedAt ?? '');
  if (byDate) return byDate;
  const aNum = isNumberedSet(a.code);
  const bNum = isNumberedSet(b.code);
  if (aNum !== bNum) return aNum ? -1 : 1;
  if (aNum && bNum) return Number(b.code) - Number(a.code);
  return (SET_ORDER.get(b.code) ?? 0) - (SET_ORDER.get(a.code) ?? 0);
});

export const ALL_CLASSIFICATIONS = Array.from(
  new Set(ALL_CARDS.flatMap((c) => c.classifications))
).sort((a, b) => a.localeCompare(b));
