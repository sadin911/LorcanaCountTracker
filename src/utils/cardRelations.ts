/**
 * "What else is like this card?" — the two questions a collector actually asks
 * from a card's detail view: what else comes from this Disney story, and what
 * other cards are this same character.
 *
 * The catalogue is a frozen static import, so both indexes are built once on
 * first use and never rebuilt.
 */
import { ALL_CARDS, SET_ORDER } from '../data/catalogue';
import type { LorcanaCard } from '../types/card';

/**
 * Same rule the data pipeline uses to join promo reprints by name. Exported so
 * the character filter compares names exactly the way this index groups them.
 */
export function normalizeCardName(input: string | null): string {
  return (input ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/** The grid's default sort, so related cards read in the same order as the grid. */
function catalogueOrder(a: LorcanaCard, b: LorcanaCard): number {
  return (
    (SET_ORDER.get(a.setCode) ?? 0) - (SET_ORDER.get(b.setCode) ?? 0) ||
    a.sortNum - b.sortNum ||
    a.sortSuffix.localeCompare(b.sortSuffix) ||
    a.id.localeCompare(b.id)
  );
}

let byStory: Map<string, LorcanaCard[]> | null = null;
let byName: Map<string, LorcanaCard[]> | null = null;

function ensureIndexes(): void {
  if (byStory && byName) return;

  const stories = new Map<string, LorcanaCard[]>();
  const names = new Map<string, LorcanaCard[]>();

  for (const card of ALL_CARDS) {
    const storyBucket = stories.get(card.story);
    if (storyBucket) storyBucket.push(card);
    else stories.set(card.story, [card]);

    const nameKey = normalizeCardName(card.name);
    const nameBucket = names.get(nameKey);
    if (nameBucket) nameBucket.push(card);
    else names.set(nameKey, [card]);
  }

  for (const list of stories.values()) list.sort(catalogueOrder);
  for (const list of names.values()) list.sort(catalogueOrder);

  byStory = stories;
  byName = names;
}

/** Every other card from this card's Disney story. */
export function relatedByStory(card: LorcanaCard): LorcanaCard[] {
  ensureIndexes();
  return (byStory?.get(card.story) ?? []).filter((c) => c.id !== card.id);
}

/**
 * Every other card sharing this card's name. Deliberately type-blind: for a
 * Character that means the same character, and for a Song, Action or Item it
 * means other printings of the same card, which is worth showing too. The
 * caller picks the heading.
 */
export function relatedBySameName(card: LorcanaCard): LorcanaCard[] {
  ensureIndexes();
  return (byName?.get(normalizeCardName(card.name)) ?? []).filter((c) => c.id !== card.id);
}
