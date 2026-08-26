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

export const ALL_CLASSIFICATIONS = Array.from(
  new Set(ALL_CARDS.flatMap((c) => c.classifications))
).sort((a, b) => a.localeCompare(b));
