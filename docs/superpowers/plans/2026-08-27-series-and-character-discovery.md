# Disney Series and Character Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a collector jump from one card to every other card in the same Disney story or of the same character, find cards by typing a Disney story name, and filter the grid by Disney story.

**Architecture:** A build-time script joins LorcanaJSON's `story` field onto the Lorcast catalogue and writes it into the static JSON the app already imports; the browser gains a new field, not a new network call. A new catalogue module centralizes the JSON imports, a new relation module builds two lazy indexes over it (story → cards, normalized name → cards), and the search key, one new filter field, and two thumbnail strips in the card modal all read from those.

**Tech Stack:** Vite 8 · React 19 · TypeScript 6 · Tailwind CSS v4 · Zustand 5 · Node scripts (plain `.mjs`, no bundler)

**Spec:** `docs/superpowers/specs/2026-08-27-series-and-character-discovery-design.md`

## Global Constraints

- **The browser must never call an external API.** All enrichment happens inside `npm run data:cards` on a developer machine. No `fetch` to a third-party host may appear anywhere under `src/`.
- Disney stories are used **verbatim at LorcanaJSON's granularity** (63 of them). Do not invent umbrella groupings such as merging `Brave Little Tailor` into `Mickey Mouse & Friends`.
- `src/data/lorcanaCards.json` must stay under the existing **3 MB** gate. `story` adds roughly 90 KB.
- **Card ids never change.** They are Firestore map keys. `id` stays `` `${setCode}-${collectorNumber}` `` verbatim, unpadded.
- **No test framework is being introduced.** Verification is the data script's own gates, `npm run build` (`tsc -b`), `npm run lint` (oxlint), and hands-on checks in the dev server. Every task below ends in a command whose output you must read.
- The UI stays **English**. Do not localize strings.
- `src/data/*.json` is **committed** to the repo (it is not gitignored). Regenerated data belongs in the commit.
- Node scripts are ESM `.mjs` and use `fail(msg)` to exit 1 loudly rather than warning. Follow that pattern.

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/fetch-lorcana-cards.mjs` *(modify)* | Fetch Lorcast + LorcanaJSON, join `story`, write all three data files, gate the result |
| `src/types/card.ts` *(modify)* | `story` on `LorcanaCard`; new `LorcanaStory` interface |
| `src/data/lorcanaStories.json` *(generated)* | `{ name, cardCount }[]`, most cards first |
| `src/data/catalogue.ts` *(create)* | The only module that imports the data JSON; derives `SET_ORDER` and `ALL_CLASSIFICATIONS` |
| `src/utils/cardRelations.ts` *(create)* | Lazy story and name indexes; `relatedByStory` / `relatedBySameName` |
| `src/utils/searchHelpers.ts` *(modify)* | Fold `story` into the per-card search key |
| `src/types/collection.ts` *(modify)* | `selectedStory` on `CollectionFilters` |
| `src/store/collectionStore.ts` *(modify)* | `selectedStory` default |
| `src/components/common/SearchableSetSelect.tsx` *(modify)* | Four label props so the same control serves sets and series |
| `src/components/collection/CollectionFilterBar.tsx` *(modify)* | Series select, placeholder copy, filter counting |
| `src/components/collection/CollectionTracker.tsx` *(modify)* | Read the catalogue module; build the story options; apply the story filter |
| `src/components/collection/RelatedCardStrip.tsx` *(create)* | One horizontally scrolling row of related card thumbnails |
| `src/components/collection/CardCollectionModal.tsx` *(modify)* | Walk between cards; story badge; two related strips |
| `src/components/collection/CollectionGridView.tsx` *(modify)* | Key the modal by card id |
| `README.md` *(modify)* | Document the new source, file, filter and search behaviour |

---

### Task 1: Join the Disney story onto the catalogue

The catalogue has no franchise field and Lorcast has nothing to derive one from. LorcanaJSON does, and joins onto all 3,192 cards in two passes.

**Files:**
- Modify: `scripts/fetch-lorcana-cards.mjs`
- Modify: `src/types/card.ts`
- Generated: `src/data/lorcanaCards.json`, `src/data/lorcanaStories.json`

**Interfaces:**
- Consumes: nothing.
- Produces: every record in `lorcanaCards.json` carries `story: string`. New file `src/data/lorcanaStories.json` is `{ name: string; cardCount: number }[]`. `src/types/card.ts` exports `LorcanaStory` and `LorcanaCard` gains `story: string`.

- [ ] **Step 1: Add the story field to the card type**

In `src/types/card.ts`, inside `interface LorcanaCard`, immediately after the `setName: string;` line:

```ts
  /** The Disney story this card comes from, e.g. "Frozen". Joined in from LorcanaJSON. */
  story: string;
```

And after the `LorcanaSet` interface, add:

```ts
/** One Disney story and how many catalogue cards belong to it. */
export interface LorcanaStory {
  name: string;
  cardCount: number;
}
```

- [ ] **Step 2: Add the LorcanaJSON constants to the fetch script**

In `scripts/fetch-lorcana-cards.mjs`, below the existing `const EXPECTED_CARDS = 3192;` line:

```js
/**
 * Disney story ("Frozen", "Mickey Mouse & Friends") comes from LorcanaJSON, not
 * Lorcast: Lorcast's card record has no franchise field at all. Fetched here at
 * build time and baked into lorcanaCards.json, because the app is forbidden from
 * calling any external API at runtime.
 */
const LORCANAJSON_URL = 'https://lorcanajson.org/files/current/en/allCards.json';

/** Guards against a LorcanaJSON schema change that silently empties `story`. */
const MIN_STORIES = 60;

/**
 * Hand-written last resort for a card that reaches Lorcast before LorcanaJSON
 * indexes it. The story gate prints ready-to-paste lines when that happens.
 * Shape: { [cardId]: 'Story Name' }.
 */
const STORY_OVERRIDES = {};
```

- [ ] **Step 3: Add the join helpers**

In the same file, directly above `function trimCard(card) {`:

```js
/** Match key for the name+version fallback: letters and digits only. */
function normalizeName(input) {
  return String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Two lookups, because LorcanaJSON does not index the promo sets (P1, P2, P3,
 * cp, C2, D23, DIS, Coconut, PD1) that Lorcast ships. Those cards are reprints,
 * so name+version resolves them: 2,985 cards match by number, 207 by name.
 */
async function buildStoryIndex() {
  console.log('🔎 Fetching Disney stories from LorcanaJSON...');
  const payload = await getJSON(LORCANAJSON_URL);
  const list = Array.isArray(payload?.cards) ? payload.cards : [];
  if (!list.length) fail('LorcanaJSON returned no cards');

  const byNumber = new Map();
  const byName = new Map();
  for (const c of list) {
    if (!c.story) continue;
    byNumber.set(`${c.setCode}-${c.number}`, c.story);
    // First writer wins: reprints of one card share a story by definition.
    const key = `${normalizeName(c.name)}|${normalizeName(c.version)}`;
    if (!byName.has(key)) byName.set(key, c.story);
  }
  console.log(`   ${list.length} records, ${byNumber.size} by number, ${byName.size} by name`);
  return { byNumber, byName };
}

/** Number match, then name+version, then the manual override table. */
function resolveStory(card, index) {
  return (
    index.byNumber.get(`${card.setCode}-${card.collectorNumber}`) ??
    index.byName.get(`${normalizeName(card.name)}|${normalizeName(card.version)}`) ??
    STORY_OVERRIDES[card.id] ??
    ''
  );
}
```

- [ ] **Step 4: Reserve the field in trimCard**

In `trimCard`, immediately after the `setName: card.set.name,` line, add:

```js
    // Filled in by the LorcanaJSON join below; declared here so the key order in
    // the emitted JSON stays stable.
    story: '',
```

- [ ] **Step 5: Run the join in main()**

In `main()`, replace this line:

```js
  console.log('🔎 Fetching set index...');
```

with:

```js
  const storyIndex = await buildStoryIndex();

  console.log('🔎 Fetching set index...');
```

Then, immediately after the `for (const s of rawSets) { ... }` loop closes and before the `// --- Gates ---` comment:

```js
  for (const card of cards) card.story = resolveStory(card, storyIndex);
```

- [ ] **Step 6: Add the story gates**

In the `// --- Gates ---` block, after the `noFinish` check:

```js
  const noStory = cards.filter((c) => !c.story);
  if (noStory.length) {
    console.error('\nUnresolved stories — paste these into STORY_OVERRIDES:');
    for (const c of noStory) {
      console.error(`  '${c.id}': '', // ${c.name}${c.version ? ` – ${c.version}` : ''}`);
    }
    fail(`${noStory.length} of ${cards.length} cards have no story`);
  }
  const storyNames = new Set(cards.map((c) => c.story));
  if (storyNames.size < MIN_STORIES) {
    fail(`only ${storyNames.size} distinct stories, expected at least ${MIN_STORIES}`);
  }
```

- [ ] **Step 7: Emit lorcanaStories.json**

Replace this block:

```js
  const cardsPath = path.join(OUT_DIR, 'lorcanaCards.json');
  const setsPath = path.join(OUT_DIR, 'lorcanaSets.json');
  fs.writeFileSync(cardsPath, JSON.stringify(cards));
  fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2));
```

with:

```js
  const cardsPath = path.join(OUT_DIR, 'lorcanaCards.json');
  const setsPath = path.join(OUT_DIR, 'lorcanaSets.json');
  const storiesPath = path.join(OUT_DIR, 'lorcanaStories.json');

  // Most cards first: the series dropdown renders this order as-is, and it is
  // searchable, so alphabetical would buy nothing.
  const storyCounts = new Map();
  for (const c of cards) storyCounts.set(c.story, (storyCounts.get(c.story) ?? 0) + 1);
  const stories = [...storyCounts.entries()]
    .map(([name, cardCount]) => ({ name, cardCount }))
    .sort((a, b) => b.cardCount - a.cardCount || a.name.localeCompare(b.name));

  fs.writeFileSync(cardsPath, JSON.stringify(cards));
  fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2));
  fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
```

Then in the log block below it, after the `console.log(\`   ${setsPath}\`);` line:

```js
  console.log(`   ${storiesPath}  ${stories.length} stories`);
```

- [ ] **Step 8: Update the script's header comment**

At the top of `scripts/fetch-lorcana-cards.mjs`, replace the two-file list:

```
 *   src/data/lorcanaSets.json   - set index
 *   src/data/lorcanaCards.json  - every card, trimmed
```

with:

```
 *   src/data/lorcanaSets.json     - set index
 *   src/data/lorcanaStories.json  - Disney story index (name + card count)
 *   src/data/lorcanaCards.json    - every card, trimmed, with its Disney story
 *
 * Two upstreams: Lorcast for the cards, LorcanaJSON for the Disney story each
 * card comes from (Lorcast has no franchise field). Both are read HERE, at build
 * time — the app itself never calls an external API.
```

- [ ] **Step 9: Regenerate the data**

Run: `npm run data:cards`

Expected: `✅ 3192 cards / 22 sets`, a `63 stories` line, and no `GATE FAILED`. The download is ~9 MB, so give it a moment.

- [ ] **Step 10: Verify the generated data**

Run:

```bash
node -e "
const c = require('./src/data/lorcanaCards.json');
const s = require('./src/data/lorcanaStories.json');
const noStory = c.filter((x) => !x.story);
console.assert(c.length === 3192, 'card count', c.length);
console.assert(noStory.length === 0, 'cards without a story: ' + noStory.length);
console.assert(s.length >= 60, 'story count ' + s.length);
console.assert(s.reduce((n, x) => n + x.cardCount, 0) === c.length, 'story counts do not sum to the catalogue');
const mickey = c.filter((x) => x.name === 'Mickey Mouse');
console.log('cards', c.length, '| stories', s.length, '| top', s[0].name, s[0].cardCount);
console.log('Mickey Mouse cards', mickey.length, '| his stories', [...new Set(mickey.map((x) => x.story))].join(', '));
console.log('Frozen', c.filter((x) => x.story === 'Frozen').length);
"
```

Expected: no assertion output, `stories 63`, top `Mickey Mouse & Friends`, 53 Mickey Mouse cards spread over several stories, and 124 Frozen cards. Any `Assertion failed` line means stop and fix the join.

- [ ] **Step 11: Confirm the size gate still has room**

Run: `ls -l src/data/lorcanaCards.json`

Expected: under 3,145,728 bytes (roughly 1.84 MB). If it is over, the gate in step 9 would already have failed.

- [ ] **Step 12: Commit**

```bash
git add scripts/fetch-lorcana-cards.mjs src/types/card.ts src/data/lorcanaCards.json src/data/lorcanaStories.json
git commit -m "feat: join each card's Disney story in from LorcanaJSON at build time"
```

---

### Task 2: Centralize the catalogue imports

`CollectionTracker` imports the data JSON directly and derives `SET_ORDER` locally. The card modal is about to need the same catalogue, and two components each importing the JSON and each deriving their own copy of the order map is the duplication to head off.

**Files:**
- Create: `src/data/catalogue.ts`
- Modify: `src/components/collection/CollectionTracker.tsx:1-24`

**Interfaces:**
- Consumes: `LorcanaCard.story` and `LorcanaStory` from Task 1.
- Produces: `src/data/catalogue.ts` exporting `ALL_CARDS: LorcanaCard[]`, `ALL_SETS: LorcanaSet[]`, `ALL_STORIES: LorcanaStory[]`, `SET_ORDER: Map<string, number>`, `ALL_CLASSIFICATIONS: string[]`.

- [ ] **Step 1: Create the catalogue module**

Create `src/data/catalogue.ts`:

```ts
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
```

- [ ] **Step 2: Point CollectionTracker at it**

In `src/components/collection/CollectionTracker.tsx`, delete these two imports:

```ts
import cardData from '../../data/lorcanaCards.json';
import setData from '../../data/lorcanaSets.json';
```

and delete this whole block:

```ts
const ALL_CARDS = cardData as LorcanaCard[];
const ALL_SETS = setData as LorcanaSet[];

/** Set order follows lorcanaSets.json (release order), not alphabetical codes. */
const SET_ORDER = new Map(ALL_SETS.map((s, i) => [s.code, i]));

const ALL_CLASSIFICATIONS = Array.from(
  new Set(ALL_CARDS.flatMap((c) => c.classifications))
).sort((a, b) => a.localeCompare(b));
```

Add this import beside the other relative imports:

```ts
import { ALL_CARDS, ALL_CLASSIFICATIONS, ALL_SETS, SET_ORDER } from '../../data/catalogue';
```

Then delete this line too — those two types were only used by the casts you just removed, and `tsconfig.app.json` sets `noUnusedLocals: true`, so leaving it breaks the build:

```ts
import type { LorcanaCard, LorcanaSet } from '../../types/card';
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: `tsc -b` and `vite build` both succeed; oxlint reports no errors. Fix any unused-import warning it names before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/data/catalogue.ts src/components/collection/CollectionTracker.tsx
git commit -m "refactor: read the catalogue through a single data module"
```

---

### Task 3: Relation index

Two lookups the card modal needs: everything from the same Disney story, and everything sharing a card name.

**Files:**
- Create: `src/utils/cardRelations.ts`

**Interfaces:**
- Consumes: `ALL_CARDS` and `SET_ORDER` from Task 2.
- Produces: `relatedByStory(card: LorcanaCard): LorcanaCard[]` and `relatedBySameName(card: LorcanaCard): LorcanaCard[]`. Both exclude the passed card and return catalogue order (set order, then `sortNum`, then `sortSuffix`).

- [ ] **Step 1: Create the module**

Create `src/utils/cardRelations.ts`:

```ts
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

/** Same rule the data pipeline uses to join promo reprints by name. */
function normalizeName(input: string | null): string {
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

    const nameKey = normalizeName(card.name);
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
  return (byName?.get(normalizeName(card.name)) ?? []).filter((c) => c.id !== card.id);
}
```

- [ ] **Step 2: Verify the relations against real data**

The module is browser-side TypeScript with no test runner behind it, so check the same logic against the generated JSON:

```bash
node -e "
const cards = require('./src/data/lorcanaCards.json');
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const mickey = cards.find((c) => c.id === '1-1');
const sameName = cards.filter((c) => norm(c.name) === norm(mickey.name) && c.id !== mickey.id);
const sameStory = cards.filter((c) => c.story === mickey.story && c.id !== mickey.id);
console.log(mickey.name, '–', mickey.version, '|', mickey.story);
console.log('same name:', sameName.length, '| same story:', sameStory.length);
const song = cards.find((c) => c.types.includes('Song'));
console.log('song', song.name, '| same name:', cards.filter((c) => norm(c.name) === norm(song.name)).length - 1);
"
```

Expected: card `1-1` reports a non-zero count for both relations, and the song reports a count of 0 or more without error. Nothing here should throw.

- [ ] **Step 3: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: both clean. The module is not imported yet, so this only proves it compiles.

- [ ] **Step 4: Commit**

```bash
git add src/utils/cardRelations.ts
git commit -m "feat: index cards by Disney story and by name"
```

---

### Task 4: Search by Disney story

Typing `frozen` currently returns nothing. One field added to the search key fixes that, and the existing cache and matcher machinery needs no change.

**Files:**
- Modify: `src/utils/searchHelpers.ts:41-60`
- Modify: `src/components/collection/CollectionFilterBar.tsx` (input placeholder)

**Interfaces:**
- Consumes: `LorcanaCard.story` from Task 1.
- Produces: nothing new; `createCardMatcher` behaviour widens to match story names.

- [ ] **Step 1: Add the story to the search key**

In `src/utils/searchHelpers.ts`, inside `getCardSearchKey`, add `card.story,` to the array immediately after `card.setName,`:

```ts
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
```

- [ ] **Step 2: Mention it in the doc comment**

Directly above that array, the comment reads:

```ts
/** Everything about a card that search should match against, pre-cleaned. */
```

Replace it with:

```ts
/**
 * Everything about a card that search should match against, pre-cleaned.
 * `story` is the Disney franchise, so "frozen" finds all 124 Frozen cards and
 * "aladdin" finds both the story and the character.
 */
```

- [ ] **Step 3: Update the search placeholder**

In `src/components/collection/CollectionFilterBar.tsx`, change the search input's placeholder from:

```tsx
            placeholder="Search name, subtitle, number, classification…"
```

to:

```tsx
            placeholder="Search name, subtitle, series, number, classification…"
```

- [ ] **Step 4: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: both clean.

- [ ] **Step 5: Verify in the browser**

Start the dev server and check the search box:

- type `frozen` — the count chip beside the search box should read `124 cards`, and the grid should show Elsa, Anna, Olaf and friends
- type `hercules` — `107 cards`
- type `mickey mouse` — Mickey cards only, not the whole Mickey story
- clear the box — back to `3,192 cards`

- [ ] **Step 6: Commit**

```bash
git add src/utils/searchHelpers.ts src/components/collection/CollectionFilterBar.tsx
git commit -m "feat: match Disney story names in card search"
```

---

### Task 5: Series filter

A searchable select beside the set select, reusing the existing control rather than cloning 226 lines of it.

**Files:**
- Modify: `src/types/collection.ts` (`CollectionFilters`)
- Modify: `src/store/collectionStore.ts:22-33` (`DEFAULT_COLLECTION_FILTERS`)
- Modify: `src/components/common/SearchableSetSelect.tsx`
- Modify: `src/components/collection/CollectionFilterBar.tsx`
- Modify: `src/components/collection/CollectionTracker.tsx`

**Interfaces:**
- Consumes: `ALL_STORIES`, `ALL_CARDS` from Task 2.
- Produces: `CollectionFilters.selectedStory: string` (`'ALL'` when off). `SearchableSetSelect` gains optional props `allLabel`, `itemNoun`, `icon`, `showCode`. `CollectionFilterBar` gains a required `stories: SetOption[]` prop.

- [ ] **Step 1: Add the filter field**

In `src/types/collection.ts`, inside `interface CollectionFilters`, after `selectedSet: string;`:

```ts
  /** Disney story name, or 'ALL'. Not a Lorcana set — see LorcanaCard.story. */
  selectedStory: string;
```

In `src/store/collectionStore.ts`, inside `DEFAULT_COLLECTION_FILTERS`, after `selectedSet: 'ALL',`:

```ts
  selectedStory: 'ALL',
```

No migration is needed: `loadInitialFilters` already spreads the defaults underneath the parsed localStorage value.

- [ ] **Step 2: Parameterize the labels in SearchableSetSelect**

The control hardcodes "Sets" in five places, and renders a mono code badge that would print a story's name twice. Add four optional props.

Replace the `Props` interface:

```ts
interface Props {
  sets: SetOption[];
  selectedSet: string;
  onSelectSet: (code: string) => void;
  placeholder?: string;
  className?: string;
  /** Label for the clear-the-filter row, e.g. "All Series". */
  allLabel?: string;
  /** Lowercase plural used in the empty state and the footer count. */
  itemNoun?: string;
  icon?: string;
  /** Off when `code` and `name` are the same string, as they are for stories. */
  showCode?: boolean;
}
```

Replace the destructuring:

```ts
export function SearchableSetSelect({
  sets,
  selectedSet,
  onSelectSet,
  placeholder = 'Choose a set…',
  className = '',
  allLabel = 'All Sets',
  itemNoun = 'sets',
  icon = '📦',
  showCode = true,
}: Props) {
```

Replace the `showAllRow` line:

```ts
  const showAllRow = !q || allLabel.toLowerCase().includes(q);
```

Then substitute inside the JSX:

| Was | Becomes |
| --- | --- |
| `<span>📦</span>` (both occurrences) | `<span>{icon}</span>` |
| `All Sets <span className="text-slate-500">({sets.length})</span>` | `{allLabel} <span className="text-slate-500">({sets.length})</span>` |
| `<span className="font-semibold">All Sets</span>` | `<span className="font-semibold">{allLabel}</span>` |
| `aria-label="Clear set filter"` | `aria-label={`Clear ${itemNoun} filter`}` |
| `No sets match “{query}”.` | `No {itemNoun} match “{query}”.` |
| `<span>{filtered.length} sets</span>` | `<span>{filtered.length} {itemNoun}</span>` |

And wrap both mono code badges — the one in the closed button showing `{selected.code}` and the one in each row showing `{s.code}` — so they disappear when `showCode` is false. For the closed button:

```tsx
              {showCode && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300 shrink-0">
                  {selected.code}
                </span>
              )}
```

For each row:

```tsx
                  {showCode && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] shrink-0">
                      {s.code}
                    </span>
                  )}
```

Finally, update the file's leading context by adding a comment above `export interface SetOption`:

```ts
/**
 * A pickable option. Named for its first user, the set filter; the series filter
 * reuses the same control with `code` and `name` both set to the story name.
 */
```

- [ ] **Step 3: Build the story options in CollectionTracker**

The existing `sets` memo already walks `ALL_CARDS` once to tally ownership. Widen that same pass instead of adding a second one. Replace the whole `const sets: SetOption[] = useMemo(...)` block with:

```tsx
  const { sets, stories } = useMemo(() => {
    const setCounts = new Map<string, { count: number; owned: number }>();
    const storyOwned = new Map<string, number>();

    for (const card of ALL_CARDS) {
      const bucket = setCounts.get(card.setCode) ?? { count: 0, owned: 0 };
      bucket.count++;
      const owned = totalCopies(ownedCards[card.id]?.variants) > 0;
      if (owned) {
        bucket.owned++;
        storyOwned.set(card.story, (storyOwned.get(card.story) ?? 0) + 1);
      }
      setCounts.set(card.setCode, bucket);
    }

    const setOptions: SetOption[] = ALL_SETS.map((s) => ({
      code: s.code,
      name: s.name,
      count: setCounts.get(s.code)?.count ?? 0,
      owned: setCounts.get(s.code)?.owned ?? 0,
    })).sort((a, b) => (SET_ORDER.get(a.code) ?? 0) - (SET_ORDER.get(b.code) ?? 0));

    // Stories are their own key: `code` and `name` are both the story name.
    const storyOptions: SetOption[] = ALL_STORIES.map((s) => ({
      code: s.name,
      name: s.name,
      count: s.cardCount,
      owned: storyOwned.get(s.name) ?? 0,
    }));

    return { sets: setOptions, stories: storyOptions };
  }, [ownedCards]);
```

Add `ALL_STORIES` to the catalogue import at the top of the file:

```ts
import { ALL_CARDS, ALL_CLASSIFICATIONS, ALL_SETS, ALL_STORIES, SET_ORDER } from '../../data/catalogue';
```

- [ ] **Step 4: Apply the filter**

Still in `CollectionTracker`, add `selectedStory` to the destructuring at the top of the `filteredCards` memo, right after `selectedSet,`:

```tsx
      selectedStory,
```

and add the test immediately after the existing `selectedSet` line inside the `.filter()` callback:

```tsx
      if (selectedStory !== 'ALL' && card.story !== selectedStory) return false;
```

Add it to `filterKey` too, right after `filters.selectedSet,`:

```tsx
    filters.selectedStory,
```

And pass the options down — in the `<CollectionFilterBar ... />` element, after the `sets={sets}` line:

```tsx
          stories={stories}
```

- [ ] **Step 5: Render the series select**

In `src/components/collection/CollectionFilterBar.tsx`, add `stories` to `Props` after `sets: SetOption[];`:

```ts
  stories: SetOption[];
```

and to the destructured parameter list after `sets,`:

```ts
  stories,
```

Add `filters.selectedStory !== 'ALL',` to the `activeFilterCount` array, as its first entry:

```tsx
  const activeFilterCount = [
    filters.selectedStory !== 'ALL',
    filters.selectedInk !== 'ALL',
```

Then insert a second select directly after the existing `<SearchableSetSelect ... />` element:

```tsx
        <SearchableSetSelect
          sets={stories}
          selectedSet={filters.selectedStory}
          onSelectSet={(story) => onChange({ selectedStory: story })}
          placeholder="Choose a Disney series…"
          allLabel="All Series"
          itemNoun="series"
          icon="🎬"
          showCode={false}
          className="w-full sm:w-auto sm:min-w-[240px]"
        />
```

- [ ] **Step 6: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: both clean.

- [ ] **Step 7: Verify in the browser**

- the 🎬 select sits beside the 📦 set select and reads `All Series (63)`
- open it, type `froz` — one row, `Frozen`, with an owned/total count
- pick it — the grid shows 124 cards and the count chip agrees
- the ✕ on the closed select clears back to `All Series`
- pick `Frozen` plus set `The First Chapter` — the two filters intersect rather than replace each other
- reload the page — `Frozen` is still selected (it round-trips through localStorage)
- "Clear filters" resets it

- [ ] **Step 8: Commit**

```bash
git add src/types/collection.ts src/store/collectionStore.ts src/components/common/SearchableSetSelect.tsx src/components/collection/CollectionFilterBar.tsx src/components/collection/CollectionTracker.tsx
git commit -m "feat: filter the grid by Disney series"
```

---

### Task 6: Related card strip

One reusable horizontal row of thumbnails. Built and reviewable on its own before the modal wires two of them up.

**Files:**
- Create: `src/components/collection/RelatedCardStrip.tsx`

**Interfaces:**
- Consumes: `resolveCardImageUrl` / `handleCardImageError` from `src/utils/cardImage`, `totalCopies` from `src/types/collection`, the collection store.
- Produces: `RelatedCardStrip` with props `{ title: string; cards: LorcanaCard[]; onSelect: (card: LorcanaCard) => void; onSeeAll: () => void }`. Renders `null` for an empty `cards` array.

- [ ] **Step 1: Create the component**

Create `src/components/collection/RelatedCardStrip.tsx`:

```tsx
import { useCollectionStore } from '../../store/collectionStore';
import type { LorcanaCard } from '../../types/card';
import { cardDisplayName } from '../../types/card';
import { totalCopies } from '../../types/collection';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';

/**
 * A story like Mickey Mouse & Friends has 176 cards. Showing them all would load
 * 176 images into a modal nobody scrolls to the end of, so the strip is a taste
 * and "See all" hands the rest to the grid.
 */
const MAX_THUMBS = 30;

interface Props {
  title: string;
  cards: LorcanaCard[];
  onSelect: (card: LorcanaCard) => void;
  onSeeAll: () => void;
}

export function RelatedCardStrip({ title, cards, onSelect, onSeeAll }: Props) {
  const ownedCards = useCollectionStore((s) => s.profiles[s.activeProfileId]?.cards ?? {});
  const showFullColor = useCollectionStore((s) => s.filters.showFullColor);

  if (!cards.length) return null;

  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-semibold text-sky-300 hover:bg-slate-800 hover:text-sky-200 whitespace-nowrap"
        >
          See all ({cards.length}) →
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {cards.slice(0, MAX_THUMBS).map((card) => {
          /* Same desaturation rule as the grid: unowned cards are dimmed unless
             Vivid mode is on. */
          const owned = totalCopies(ownedCards[card.id]?.variants) > 0;
          const vivid = owned || showFullColor;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              title={cardDisplayName(card)}
              className={`shrink-0 w-[74px] rounded-lg border overflow-hidden bg-slate-950 transition-colors ${
                owned ? 'border-sky-600/60 hover:border-sky-400' : 'border-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden">
                <img
                  src={resolveCardImageUrl(card.setCode, card.collectorNumber)}
                  alt={cardDisplayName(card)}
                  loading="lazy"
                  onError={(e) => handleCardImageError(e, card.setCode, card.collectorNumber)}
                  /* Locations are landscape; contain rather than crop them. */
                  className={`w-full h-full ${card.layout === 'landscape' ? 'object-contain' : 'object-cover'} ${
                    vivid ? '' : 'grayscale opacity-60'
                  }`}
                />
              </div>
              <p className="px-1 py-0.5 font-mono text-[9px] text-slate-500 truncate">
                {card.setCode}·{card.collectorNumber}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: both clean. The component is not mounted yet, so this only proves it compiles.

- [ ] **Step 3: Commit**

```bash
git add src/components/collection/RelatedCardStrip.tsx
git commit -m "feat: add a related-card thumbnail strip"
```

---

### Task 7: Wire the strips into the card detail modal

**Files:**
- Modify: `src/components/collection/CardCollectionModal.tsx`
- Modify: `src/components/collection/CollectionGridView.tsx` (modal element)

**Interfaces:**
- Consumes: `relatedByStory` / `relatedBySameName` from Task 3, `RelatedCardStrip` from Task 6, `DEFAULT_COLLECTION_FILTERS` and `setFilters` from the store, `CollectionFilters` type from Task 5.
- Produces: no new exports. The modal's props are unchanged.

- [ ] **Step 1: Rename the prop, keep the body**

The whole modal body already refers to `card`. Rename the incoming prop instead of rewriting 200 lines: in `src/components/collection/CardCollectionModal.tsx`, change

```tsx
export function CardCollectionModal({ card, onClose }: Props) {
  const [showZoom, setShowZoom] = useState(false);
```

to

```tsx
export function CardCollectionModal({ card: initialCard, onClose }: Props) {
  /* The displayed card is state, not the prop: clicking a related thumbnail
     walks the modal to that card instead of closing it. CollectionGridView keys
     this component by card id, so opening a different card from the grid
     remounts and starts the walk over. */
  const [card, setCard] = useState(initialCard);
  const [showZoom, setShowZoom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
```

Every existing reference to `card` in the body now reads the state, unchanged.

- [ ] **Step 2: Update the imports**

Replace the import block at the top of the file:

```tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CONDITIONS, FINISH_META, INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { useCollectionStore } from '../../store/collectionStore';
import type { FinishKey, LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { CardCondition } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
```

with:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CONDITIONS, FINISH_META, INK_STYLES, RARITY_STYLES, TYPE_ICONS } from '../../constants/lorcana';
import { DEFAULT_COLLECTION_FILTERS, useCollectionStore } from '../../store/collectionStore';
import type { FinishKey, LorcanaCard } from '../../types/card';
import { cardDisplayName, rarityLabel } from '../../types/card';
import type { CardCondition, CollectionFilters } from '../../types/collection';
import { totalCopies } from '../../types/collection';
import { relatedByStory, relatedBySameName } from '../../utils/cardRelations';
import { handleCardImageError, resolveCardImageUrl } from '../../utils/cardImage';
import { RelatedCardStrip } from './RelatedCardStrip';
```

- [ ] **Step 3: Add the navigation and see-all handlers**

Immediately after the `const clearCard = useCollectionStore((s) => s.clearCard);` line, add:

```tsx
  const setFilters = useCollectionStore((s) => s.setFilters);
  const showFullColor = useCollectionStore((s) => s.filters.showFullColor);

  const sameName = useMemo(() => relatedBySameName(card), [card]);
  const sameStory = useMemo(() => relatedByStory(card), [card]);

  /* "Same character" for Characters; for a Song, Action or Item the same name
     means other printings of that card, which is still worth offering. */
  const sameNameTitle = card.types.includes('Character') ? 'Same character' : 'Cards with this name';

  const goToCard = (next: LorcanaCard) => {
    setCard(next);
    setShowZoom(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* "See all" must mean all of them, not the leftovers of a stale ink or rarity
     filter — so reset to defaults and apply exactly one condition. showFullColor
     survives because it is a display preference, not a filter. */
  const seeAll = (patch: Partial<CollectionFilters>) => {
    setFilters({ ...DEFAULT_COLLECTION_FILTERS, showFullColor, ...patch });
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
```

- [ ] **Step 4: Attach the scroll ref**

The modal's scrolling container is the inner div. Change

```tsx
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
```

to

```tsx
      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
```

- [ ] **Step 5: Add the story badge to the header**

In the badge row, directly after the `{card.setCode}` span, add:

```tsx
                  <button
                    type="button"
                    onClick={() => seeAll({ selectedStory: card.story })}
                    title={`Show every card from ${card.story}`}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-amber-200 hover:border-amber-500 hover:text-amber-100"
                  >
                    🎬 {card.story}
                  </button>
```

- [ ] **Step 6: Render the two strips**

The strips go full width below the 12-column grid, inside the scrolling container — the right-hand column is already dense, and a horizontal scroller wants the room. Directly after the closing `</div>` of `<div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">`, add:

```tsx
        {(sameName.length > 0 || sameStory.length > 0) && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-3">
            <RelatedCardStrip
              title={sameNameTitle}
              cards={sameName}
              onSelect={goToCard}
              onSeeAll={() => seeAll({ search: card.name })}
            />
            <RelatedCardStrip
              title={`Same series — ${card.story}`}
              cards={sameStory}
              onSelect={goToCard}
              onSeeAll={() => seeAll({ selectedStory: card.story })}
            />
          </div>
        )}
```

- [ ] **Step 7: Key the modal by card id**

In `src/components/collection/CollectionGridView.tsx`, change

```tsx
      {selectedCard && <CardCollectionModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
```

to

```tsx
      {/* Keyed by id so opening a different card from the grid remounts the modal
          and resets any walk through related cards. */}
      {selectedCard && (
        <CardCollectionModal key={selectedCard.id} card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
```

- [ ] **Step 8: Typecheck and lint**

Run: `npm run build && npm run lint`

Expected: both clean.

- [ ] **Step 9: Verify in the browser**

Open a Mickey Mouse character card and check:

- the header shows a `🎬 Mickey Mouse & Friends` badge
- two strips sit at the bottom: `Same character` and `Same series — Mickey Mouse & Friends`
- unowned thumbnails are desaturated; turning Vivid mode on colours them
- clicking a thumbnail switches the modal to that card, the strips update, and the panel scrolls back to the top
- Escape closes the modal from the walked-to card
- `See all` on the character strip closes the modal, puts `Mickey Mouse` in the search box, clears every other filter, and scrolls to the top
- `See all` on the series strip selects `Mickey Mouse & Friends` in the 🎬 filter and shows 176 cards
- the `🎬` header badge does the same thing as the series `See all`
- open a Song (e.g. search `friends on the other side`) — the first strip reads `Cards with this name`, or is absent if that song has only one printing
- open a Location — its landscape thumbnails are letterboxed, not cropped
- the finish counters, wishlist star, condition, note and "Remove from binder" all still operate on the card currently displayed, not the one you opened from the grid

- [ ] **Step 10: Commit**

```bash
git add src/components/collection/CardCollectionModal.tsx src/components/collection/CollectionGridView.tsx
git commit -m "feat: browse same-character and same-series cards from the card detail view"
```

---

### Task 8: Documentation and a full pass

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Update the features list**

In `README.md`, under "Features (Phase 1)", replace the `**Filters**` and `**Fast search**` bullets:

```markdown
- **Filters** — set, Disney series, ownership status, ink (dual-ink aware), card
  type, rarity, classification, plus sorting by number, name, ink cost, lore,
  strength or copies.
- **Fast search** — matches name, subtitle, Disney series, collector number, set
  and classification, so "frozen" returns all 124 Frozen cards.
- **Related cards** — every card's detail view links to the other cards of that
  same character and the other cards from that same Disney series.
```

- [ ] **Step 2: Document the second upstream**

In `README.md`, in the "Data pipeline" table, replace the `npm run data:cards` row:

```markdown
| `npm run data:cards` | Fetches every set and card from the Lorcast API, joins each card's Disney story in from [LorcanaJSON](https://lorcanajson.org) (Lorcast has no franchise field), and writes `src/data/lorcanaCards.json` (~1.84 MB), `src/data/lorcanaSets.json` and `src/data/lorcanaStories.json`. Fails loudly if the card count, id uniqueness, story coverage, story count or JSON size gate is violated. |
```

- [ ] **Step 3: Note the runtime rule**

In `README.md`, immediately below the "Data pipeline" table, add:

```markdown
Both upstreams are read **only** by these scripts, on a developer machine. The app
itself never calls an external API: the catalogue, the set index and the story
index are static JSON imports, and card images come from R2. The Disney story is
joined in two passes — `setCode`+`collectorNumber` covers 2,985 cards, and a
normalized `name`+`version` fallback covers the 207 promo reprints LorcanaJSON
does not index. A card that resolves through neither trips a gate that prints
paste-ready lines for the `STORY_OVERRIDES` table in the script.
```

- [ ] **Step 4: Full verification pass**

Run: `npm run build && npm run lint`

Expected: both clean.

Then confirm the no-external-API constraint holds in shipped code:

```bash
grep -rniE "lorcast|lorcanajson|api\.lorcast" src/ || echo "no external API reference in src/"
```

Expected: only comment mentions, never a `fetch` call. A `fetch` to either host inside `src/` is a constraint violation — remove it.

- [ ] **Step 5: End-to-end pass in the dev server**

With the dev server running, walk the whole feature once:

1. search `frozen` → 124 cards
2. clear search, pick `🎬 Frozen` → 124 cards, dropdown shows owned/total
3. open Elsa → header badge reads `🎬 Frozen`, both strips render
4. click a thumbnail → modal walks, strips update
5. `See all` on the series strip → grid shows the whole series, other filters cleared
6. add a copy of a card, reopen its modal → the strip thumbnail for it is now coloured and outlined
7. reload → the series filter survived
8. "Clear filters" → 3,192 cards

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: document Disney series discovery and the LorcanaJSON upstream"
```
