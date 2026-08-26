# Disney series and character discovery

Date: 2026-08-27

## Problem

The catalogue knows which Lorcana *set* a card belongs to but nothing about which
Disney *story* it comes from. A collector looking at Mickey Mouse – Brave Little
Tailor cannot ask either of the two questions they actually have:

- "What else comes from this Disney series?"
- "What other cards are this same character?"

Search is equally blind: typing `frozen` returns nothing, because no field on a
card mentions Frozen.

## Constraint: no external API at runtime

The browser must never call an external API. Every byte the app reads is a static
JSON import, exactly as today. All enrichment happens ahead of time inside
`npm run data:cards`, which runs on a developer machine.

## Data source

The Lorcast API — the app's current source — has no franchise field; its full card
record was checked and there is nothing to derive one from. LorcanaJSON
(`https://lorcanajson.org/files/current/en/allCards.json`, 8.8 MB) carries a
`story` field with 63 Disney stories: `Frozen`, `Aladdin`,
`Mickey Mouse & Friends`, `Mickey's Christmas Carol`, `Lorcana`, and so on.

Stories are used verbatim, at LorcanaJSON's own granularity. Mickey therefore
spans several stories (`Mickey Mouse & Friends` 176 cards,
`Mickey's Christmas Carol` 11, `Fantasia` 6, `The Sorcerer's Apprentice` 4,
`Brave Little Tailor` 3, `Mickey and the Beanstalk` 2). No umbrella grouping is
invented: it would be a hand-maintained mapping that goes stale with every set,
and the same-character relation already covers the "all the Mickeys" case.

### Join

Two passes, verified against the current catalogue:

| Pass | Key | Cards matched |
| --- | --- | --- |
| 1 | `setCode` + `number` + normalized `name` + `version` | 2,985 |
| 2 | normalized `name` + `version` | 207 |
| | **total** | **3,192 / 3,192** |

Pass 1 does **not** key on `setCode` + `number` alone. LorcanaJSON files promos
under the main set's `setCode` too, so 160 of those keys are ambiguous — `1-1` is
Ariel – On Human Legs *and* the P1 and D23 promos printed as card 1 — and a plain
number join silently assigns whichever record happens to be indexed last. Keyed
that way, 155 of 2,985 cards got the wrong story. Folding the name and version
into the key makes each match unambiguous by construction.

Pass 2 exists because LorcanaJSON numbers the promo sets (`P1`, `P2`, `P3`, `cp`,
`C2`, `D23`, `DIS`, `Coconut`, `PD1`) differently from Lorcast; those cards are
reprints, so name + version resolves them. Normalization is `toLowerCase()` then
strip everything outside `[a-z0-9]`.

Two names in LorcanaJSON map to two stories each — `Mickey Mouse – Wayward
Sorcerer` and the versionless action `Distract`. Both resolve through pass 1, so
pass 2 never has to guess between them today; a gate fails the build if it ever
does, naming the cards so they can be pinned in `STORY_OVERRIDES`.

## Pipeline changes

`scripts/fetch-lorcana-cards.mjs`:

1. Fetch LorcanaJSON once, build both lookup maps.
2. `trimCard` gains `story: string`, resolved pass 1 → pass 2 → `STORY_OVERRIDES`.
3. `STORY_OVERRIDES` is a small hand-written `{ [cardId]: story }` map, empty to
   begin with. It is the escape hatch for a card that reaches Lorcast before
   LorcanaJSON indexes it.
4. New file `src/data/lorcanaStories.json`: `{ name: string, cardCount: number }[]`,
   sorted by `cardCount` descending. Written pretty-printed like
   `lorcanaSets.json`. It gives the app the story list and its totals without
   scanning 3,192 cards to discover which stories exist.
5. New gates, in the existing fail-loudly style:
   - every card has a non-empty `story`, else exit 1 printing every unresolved id
     so `STORY_OVERRIDES` can be filled in;
   - no card takes its story from a name that LorcanaJSON maps to more than one
     story, else exit 1 naming those cards;
   - at least 60 distinct stories, which catches a schema change on the
     LorcanaJSON side that silently empties the field.

   The script also logs how many cards each pass resolved, so a shift in the
   upstream's indexing is visible rather than silent.

The existing 3 MB gate on `lorcanaCards.json` stays. `story` adds roughly 90 KB
(1.75 MB → ~1.84 MB).

`src/types/card.ts` gains `story: string` on `LorcanaCard`, and a
`LorcanaStory { name: string; cardCount: number }` interface.

## Catalogue module

New `src/data/catalogue.ts` becomes the only module that imports the data JSON:

```ts
export const ALL_CARDS: LorcanaCard[]
export const ALL_SETS: LorcanaSet[]
export const ALL_STORIES: LorcanaStory[]
export const SET_ORDER: Map<string, number>   // release order, from ALL_SETS
export const ALL_CLASSIFICATIONS: string[]    // sorted, derived
```

`CollectionTracker` moves off its direct JSON imports and onto this. The modal
needs the catalogue too, and importing the same JSON from two components — each
deriving its own `SET_ORDER` — is the thing being avoided.

## Relation index

New `src/utils/cardRelations.ts`. The catalogue is a frozen static import, so the
maps are built lazily on first call and never rebuilt:

```ts
relatedByStory(card: LorcanaCard): LorcanaCard[]     // same story, minus itself
relatedBySameName(card: LorcanaCard): LorcanaCard[]  // same normalized name, minus itself
```

Both return set-order then `sortNum` then `sortSuffix`, matching the grid's
default sort. Name normalization is shared with the pipeline's pass-2 rule.

`relatedBySameName` is deliberately type-blind. For a Character it means the same
character; for a Song, Action or Item it means other printings of that same card,
which is still worth showing. The heading differs — "Same character" versus
"Cards with this name" — and that is the only place the distinction lives.

## Search

`getCardSearchKey` in `src/utils/searchHelpers.ts` adds `card.story` to the
pre-cleaned key. Nothing else in the search machinery changes: the string cache,
the per-card `WeakMap` and the compiled matcher all keep working, and the story is
folded into the same AND-of-tokens-or-whole-phrase behaviour. Typing `frozen`
returns the 124 Frozen cards; `aladdin` returns the story *and* the character.

The input placeholder becomes
`Search name, subtitle, series, number, classification…`.

## Series and character filters

`CollectionFilters` gains two fields, both defaulting to `'ALL'`:
`selectedStory` (a Disney story name) and `selectedCharacter` (a card name).

`selectedCharacter` exists because folding `story` into the search key makes a
name query bleed into its whole story: searching `Mickey Mouse` returns 193 cards
— the 58 that are him plus the 179 in `Mickey Mouse & Friends`. A "See all (57)"
button that lands on 193 cards teaches the collector to distrust the numbers, so
the character relation gets an exact filter of its own rather than riding on
search. Both sides of the comparison run through `normalizeCardName`, so the
filter groups cards exactly the way the relation index does.

The character filter has no picker — it is set only by the modal's same-character
"See all" — so the filter bar renders it as a labelled chip (`🧝 Mickey Mouse ✕`)
whenever it is active. Without that, a collector could land in a filtered state
with no visible way out.

Typing a name into the search box still works and still spans the story; that is
the looser, exploratory path, and it is what the user asked search to do.
`loadInitialFilters` already spreads defaults underneath the parsed localStorage
value, so saved filter state stays valid without a migration.

`CollectionTracker`'s filter chain gains two tests:

```ts
if (selectedStory !== 'ALL' && card.story !== selectedStory) return false;
if (
  selectedCharacter !== 'ALL' &&
  normalizeCardName(card.name) !== normalizeCardName(selectedCharacter)
) {
  return false;
}
```

`normalizeCardName` is exported from `src/utils/cardRelations.ts` — the same
function the name index is keyed on, so there is one definition of "same name".

Both fields join `filterKey` (so pagination resets) and `activeFilterCount`.

The control reuses `SearchableSetSelect` rather than duplicating it: stories map
onto `SetOption` with `code` and `name` both set to the story name, `count` taken
from `lorcanaStories.json`, and `owned` tallied in the same single pass over
`ALL_CARDS` that already tallies owned-per-set — the loop gains one map lookup, not
a second traversal. Order follows `ALL_STORIES`, i.e. most cards first; the
dropdown is searchable, so alphabetical ordering buys nothing.
The component needs one change — an optional `allLabel` prop, because `All sets`
is currently hardcoded in both the row label and the `showAllRow` query test.

Placement: row 1 of the filter bar, beside the set select, always visible. The
free win is that the dropdown shows per-series completion, e.g.
`Frozen  89/124 · 72%`.

## Card detail modal

`CardCollectionModal` holds the displayed card in local state:

```ts
const [current, setCurrent] = useState(card);
```

Clicking a thumbnail in a related strip calls `setCurrent`, so the modal walks
between cards without closing. `CollectionGridView` renders it with
`key={selectedCard.id}`, so opening a different card from the grid remounts and
resets that walk cleanly — no effect syncing prop to state.

Every hook in the modal keys off `current` rather than `card`.

New `src/components/collection/RelatedCardStrip.tsx`:

```ts
interface Props {
  title: string;
  cards: LorcanaCard[];
  onSelect: (card: LorcanaCard) => void;
  onSeeAll: () => void;
}
```

A horizontally scrolling row of thumbnails (small image tier, `object-contain`
for landscape Locations like the grid does), unowned cards desaturated the same
way the grid desaturates them, capped at 30 thumbnails, followed by a
`See all (n)` button. Renders nothing when `cards` is empty.

The modal renders two strips in a full-width section below the existing 12-column
grid: same-character first, then same-story. Full width because the right column
is already dense and a horizontal scroller wants the room.

The story also appears as a clickable badge in the modal header, next to the set
code.

`See all` resets filters to their defaults and then applies exactly one
condition — `{ selectedStory: story }` for the story strip,
`{ selectedCharacter: card.name }` for the name strip — then closes the modal and
scrolls to top. Resetting is the
point: "see all of these" must not silently return the leftovers of a stale ink
or rarity filter. `showFullColor` survives the reset because it is a display
preference, not a filter.

## Testing

The project has no test framework installed and this work does not justify
introducing one. Verification is:

- `npm run data:cards` — its gates *are* the test of the data layer: 3,192 cards,
  unique ids, every card carrying a story, at least 60 stories, JSON under 3 MB.
- `npm run build` (`tsc -b`) and `npm run lint`.
- Manual pass on the dev server: search `frozen`; open a Mickey Mouse card and
  check both strips; click a thumbnail and confirm the modal switches; use both
  `See all` buttons; drive the Series dropdown and confirm counts and progress.

## Out of scope

- Umbrella story grouping.
- A per-series progress panel above the grid, of the kind `SetProgress` gives for
  sets.
- Localizing the UI; the interface stays English, as it is today.
