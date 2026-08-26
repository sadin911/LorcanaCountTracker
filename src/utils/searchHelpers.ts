/**
 * Card search. Distilled from the Pokemon app's searchHelpers.ts: its Thai
 * translation layer is gone, but the parts that make searching 3,000+ cards feel
 * instant are kept — a capped string cache, per-card WeakMap caches, and a
 * matcher that compiles the query once and is then a cheap closure per card.
 */
import type { LorcanaCard } from '../types/card';

const CLEAN_CACHE_LIMIT = 5000;
const cleanCache = new Map<string, string>();

/** Lowercase, drop punctuation, collapse whitespace. */
export function cleanString(input: string): string {
  const cached = cleanCache.get(input);
  if (cached !== undefined) return cached;

  const out = input
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[-.:_,!?/\\()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanCache.size >= CLEAN_CACHE_LIMIT) cleanCache.clear();
  cleanCache.set(input, out);
  return out;
}

// Keyed on the card object itself: the catalogue is a frozen static import, so
// these are computed at most once per card for the lifetime of the page.
const searchKeyCache = new WeakMap<LorcanaCard, string>();

/**
 * Everything about a card that search should match against, pre-cleaned.
 * `story` is the Disney franchise, so "frozen" finds every Frozen card and
 * "aladdin" finds both the story and the character.
 */
export function getCardSearchKey(card: LorcanaCard): string {
  let key = searchKeyCache.get(card);
  if (key === undefined) {
    key = cleanString(
      [
        card.name,
        card.version ?? '',
        card.collectorNumber,
        card.setCode,
        card.setName,
        card.story,
        card.types.join(' '),
        card.classifications.join(' '),
        card.inks.join(' '),
      ].join(' ')
    );
    searchKeyCache.set(card, key);
  }
  return key;
}

export type CardMatcher = (card: LorcanaCard) => boolean;

/**
 * Compile a query once, then test cards cheaply.
 *
 * All tokens must match (AND), each as a substring of the card's search key —
 * so "elsa queen" finds Elsa cards classified Queen, and "1 125" finds card 125
 * of set 1. An empty query matches everything.
 */
export function createCardMatcher(rawQuery: string): CardMatcher {
  const cleaned = cleanString(rawQuery || '');
  if (!cleaned) return () => true;

  const tokens = cleaned.split(' ').filter(Boolean);
  if (!tokens.length) return () => true;

  // The whole phrase as typed is the most common intent ("magic broom"), so try
  // it as one substring first and only fall back to per-token AND matching.
  const phrase = tokens.join(' ');

  return (card: LorcanaCard) => {
    const key = getCardSearchKey(card);
    if (key.includes(phrase)) return true;
    for (const t of tokens) {
      if (!key.includes(t)) return false;
    }
    return true;
  };
}
