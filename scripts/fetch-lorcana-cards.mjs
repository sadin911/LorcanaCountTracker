/**
 * Fetch the full Disney Lorcana catalogue from the Lorcast API and emit two
 * trimmed JSON files that the app statically imports:
 *
 *   src/data/lorcanaSets.json     - set index
 *   src/data/lorcanaStories.json  - Disney story index (name + card count)
 *   src/data/lorcanaCards.json    - every card, trimmed, with its Disney story
 *
 * Two upstreams: Lorcast for the cards, LorcanaJSON for the Disney story each
 * card comes from (Lorcast has no franchise field). Both are read HERE, at build
 * time — the app itself never calls an external API.
 *
 * Deliberately omitted from card records: prices, purchase_uris, legalities,
 * tcgplayer_id, flavor_text, and image URLs. Image paths are DERIVED from
 * setCode + collectorNumber by src/utils/cardImage.ts, so baking them in here
 * would triple the JSON size for no gain.
 */
import fs from 'fs';
import path from 'path';

const API = 'https://api.lorcast.com/v0';
const OUT_DIR = path.resolve('src/data');
const MAX_JSON_BYTES = 3 * 1024 * 1024;

const EXPECTED_SETS = 25;
const EXPECTED_CARDS = 3204;

/**
 * Custom special / park promo sets not yet indexed as dedicated sets in Lorcast API.
 * Included here at build time so the app statically bundles them.
 */
const CUSTOM_PROMO_SETS = [
  {
    set: {
      code: 'HKDL',
      name: 'Hong Kong Disneyland',
      releasedAt: '2026-08-28',
    },
    cards: [
      {
        id: 'HKDL-1',
        name: 'Mickey Mouse',
        version: 'Amber Champion',
        setCode: 'HKDL',
        setName: 'Hong Kong Disneyland',
        story: 'Mickey Mouse & Friends',
        collectorNumber: '1',
        sortNum: 1,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Amber'],
        inkwell: true,
        cost: 4,
        types: ['Character'],
        classifications: ['Dreamborn', 'Hero'],
        strength: 2,
        willpower: 5,
        lore: 1,
        moveCost: null,
        text: 'LEADING THE WAY Your other Amber characters get +2 Willpower.\nFRIENDLY CHORUS While you have 2 or more other Amber characters in play, this character gains Singer 8. (They count as cost 8 to sing songs.)',
        keywords: ['Singer'],
        illustrators: ['Lisa Parfenova'],
        layout: 'normal',
        finishes: ['foil'],
      },
      {
        id: 'HKDL-2',
        name: 'Buzz Lightyear',
        version: 'Providing Cover',
        setCode: 'HKDL',
        setName: 'Hong Kong Disneyland',
        story: 'Toy Story',
        collectorNumber: '2',
        sortNum: 2,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Emerald'],
        inkwell: false,
        cost: 4,
        types: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Toy', 'Captain'],
        strength: 4,
        willpower: 2,
        lore: 2,
        moveCost: null,
        text: 'ACTION FIGURE When you play this character, choose one of the following. If you have another Toy character in play, choose both instead:\n• You may return an action card with cost 2 or less from your discard to your hand.\n• You may play an action with cost 2 or less for free.',
        keywords: [],
        illustrators: ['Marcel Berg'],
        layout: 'normal',
        finishes: ['foil'],
      },
      {
        id: 'HKDL-3',
        name: 'Elsa',
        version: 'The Fifth Spirit',
        setCode: 'HKDL',
        setName: 'Hong Kong Disneyland',
        story: 'Frozen',
        collectorNumber: '3',
        sortNum: 3,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Amethyst'],
        inkwell: true,
        cost: 5,
        types: ['Character'],
        classifications: ['Dreamborn', 'Hero', 'Queen', 'Sorcerer'],
        strength: 2,
        willpower: 5,
        lore: 1,
        moveCost: null,
        text: "Rush (This character can challenge the turn they're played.)\nEvasive (Only characters with Evasive can challenge this character.)\nCRYSTALLIZE When you play this character, exert chosen opposing character.",
        keywords: ['Rush', 'Evasive'],
        illustrators: ['Lisanne Koeteeuw'],
        layout: 'normal',
        finishes: ['foil'],
      },
    ],
  },
  {
    set: {
      code: 'DLP',
      name: 'Disneyland Paris',
      releasedAt: '2026-09-04',
    },
    cards: [
      {
        id: 'DLP-1',
        name: 'Mickey Mouse',
        version: "Champion d'Ambre",
        setCode: 'DLP',
        setName: 'Disneyland Paris',
        story: 'Mickey Mouse & Friends',
        collectorNumber: '1',
        sortNum: 1,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Amber'],
        inkwell: true,
        cost: 4,
        types: ['Character'],
        classifications: ['Dreamborn', 'Hero'],
        strength: 2,
        willpower: 5,
        lore: 1,
        moveCost: null,
        text: 'OUVRE LA VOIE Vos autres personnages Ambre gagnent +2 Volonté.\nCHŒUR AMICAL Tant que vous avez 2 autres personnages Ambre ou plus en jeu, ce personnage gagne Singer 8.',
        keywords: ['Singer'],
        illustrators: ['Lisa Parfenova'],
        layout: 'normal',
        finishes: ['foil'],
      },
      {
        id: 'DLP-2',
        name: "Buzz l'Éclair",
        version: 'Couverture Tactique',
        setCode: 'DLP',
        setName: 'Disneyland Paris',
        story: 'Toy Story',
        collectorNumber: '2',
        sortNum: 2,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Emerald'],
        inkwell: false,
        cost: 4,
        types: ['Character'],
        classifications: ['Storyborn', 'Hero', 'Toy', 'Captain'],
        strength: 4,
        willpower: 2,
        lore: 2,
        moveCost: null,
        text: "FIGURINE D'ACTION Lorsque vous jouez ce personnage, choisissez une option. Si vous avez un autre personnage Jouet en jeu, choisissez les deux à la place :\n• Vous pouvez reprendre en main une carte Action de coût 2 ou moins de votre défausse.\n• Vous pouvez jouer gratuitement une carte Action de coût 2 ou moins.",
        keywords: [],
        illustrators: ['Marcel Berg'],
        layout: 'normal',
        finishes: ['foil'],
      },
      {
        id: 'DLP-3',
        name: 'Elsa',
        version: 'Le Cinquième Esprit',
        setCode: 'DLP',
        setName: 'Disneyland Paris',
        story: 'Frozen',
        collectorNumber: '3',
        sortNum: 3,
        sortSuffix: '',
        rarity: 'Promo',
        inks: ['Amethyst'],
        inkwell: true,
        cost: 5,
        types: ['Character'],
        classifications: ['Dreamborn', 'Hero', 'Queen', 'Sorcerer'],
        strength: 2,
        willpower: 5,
        lore: 1,
        moveCost: null,
        text: 'Charge (Ce personnage peut défier le tour où il est joué.)\nInsaisissable (Seuls les personnages avec Insaisissable peuvent défier ce personnage.)\nCRISTALLISATION Lorsque vous jouez ce personnage, épuisez le personnage adverse choisi.',
        keywords: ['Charge', 'Insaisissable'],
        illustrators: ['Lisanne Koeteeuw'],
        layout: 'normal',
        finishes: ['foil'],
      },
    ],
  },
];

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

/** Rarities that only ever exist as a foil printing. */
const FOIL_ONLY_RARITIES = new Set(['Enchanted', 'Epic', 'Iconic']);

/**
 * Which physical finishes a card exists in. Driven by a rule table, NOT by the
 * API's `prices` keys: prices are market-listing artifacts (~90 cards have
 * partial or no prices), so a price blip on a later run would silently change
 * which finishes a collector is allowed to record.
 */
function deriveFinishes(card) {
  const num = String(card.collector_number);
  // Reign of Jafar (set 8) ships 5 foil-only reprints numbered 1f/2f/3f/65f/125f,
  // alongside separate non-foil entries numbered 1/2/3/65/125.
  if (card.set.code === '8' && num.endsWith('f')) return ['foil'];
  if (FOIL_ONLY_RARITIES.has(card.rarity)) return ['foil'];
  return ['normal', 'foil'];
}

async function getJSON(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 4) throw new Error(`${url} failed after ${attempt} attempts: ${err.message}`);
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return getJSON(url, attempt + 1);
  }
}

/** Match key for the name+version fallback: letters and digits only. */
function normalizeName(input) {
  return String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/**
 * Deliberately NOT keyed on `setCode`+`number` alone. LorcanaJSON files promos
 * under the main set's setCode as well, so 160 of those keys are ambiguous:
 * `1-1` is Ariel – On Human Legs, and also the P1 and D23 promos printed as
 * card 1. Keying on the name and version too makes the match unambiguous by
 * construction rather than dependent on which record happens to be indexed last.
 */
function exactKey(setCode, number, name, version) {
  return `${setCode}|${number}|${normalizeName(name)}|${normalizeName(version)}`;
}

function nameKey(name, version) {
  return `${normalizeName(name)}|${normalizeName(version)}`;
}

/**
 * Two lookups. The exact one covers the 2,985 cards LorcanaJSON indexes under
 * Lorcast's own set codes; a name+version lookup covers the remaining 213, which
 * are the promo sets (P1, P2, P3, cp, C2, D23, DIS, CC1, Coconut, PD1) LorcanaJSON
 * numbers differently. Those are reprints, so name+version is a safe key —
 * except for two names that LorcanaJSON maps to two stories, which is what
 * `ambiguousNames` is for.
 */
async function buildStoryIndex() {
  console.log('🔎 Fetching Disney stories from LorcanaJSON...');
  const payload = await getJSON(LORCANAJSON_URL);
  const list = Array.isArray(payload?.cards) ? payload.cards : [];
  if (!list.length) fail('LorcanaJSON returned no cards');

  const byExact = new Map();
  const byName = new Map();
  const storiesPerName = new Map();

  for (const c of list) {
    if (!c.story) continue;
    byExact.set(exactKey(String(c.setCode), String(c.number), c.name, c.version), c.story);
    const key = nameKey(c.name, c.version);
    // First writer wins; a conflict is recorded rather than silently resolved.
    if (!byName.has(key)) byName.set(key, c.story);
    const seen = storiesPerName.get(key) ?? new Set();
    seen.add(c.story);
    storiesPerName.set(key, seen);
  }

  const ambiguousNames = new Set(
    [...storiesPerName.entries()].filter(([, v]) => v.size > 1).map(([k]) => k)
  );

  console.log(
    `   ${list.length} records, ${byExact.size} exact keys, ${byName.size} name keys` +
      `, ${ambiguousNames.size} ambiguous names`
  );
  return { byExact, byName, ambiguousNames };
}

/** Exact match, then name+version, then the manual override table. */
function resolveStory(card, index) {
  const exact = index.byExact.get(
    exactKey(card.setCode, card.collectorNumber, card.name, card.version)
  );
  if (exact) return { story: exact, pass: 'exact' };

  const key = nameKey(card.name, card.version);
  const byName = index.byName.get(key);
  if (byName) return { story: byName, pass: 'name', ambiguous: index.ambiguousNames.has(key) };

  const override = STORY_OVERRIDES[card.id];
  if (override) return { story: override, pass: 'override' };

  return { story: '', pass: 'none' };
}

function trimCard(card) {
  const num = String(card.collector_number);
  const digits = num.match(/^\d+/);
  return {
    // `${setCode}-${collectorNumber}` verbatim is unique across all 3,192 cards.
    // Do NOT zero-pad: set 8 has both "1" and "1f", and padding after stripping
    // non-digits would collide them.
    id: `${card.set.code}-${num}`,
    name: card.name,
    version: card.version || null,
    setCode: card.set.code,
    setName: card.set.name,
    // Filled in by the LorcanaJSON join below; declared here so the key order in
    // the emitted JSON stays stable.
    story: '',
    collectorNumber: num,
    sortNum: digits ? parseInt(digits[0], 10) : 0,
    sortSuffix: num.replace(/^\d+/, ''),
    rarity: card.rarity,
    // `ink` is null for 160 cards and `inks` carries 2 entries for 187 dual-ink
    // cards, so the app always reads the array.
    inks: card.inks && card.inks.length ? card.inks : card.ink ? [card.ink] : [],
    inkwell: !!card.inkwell,
    cost: card.cost ?? null,
    types: card.type || [],
    classifications: card.classifications || [],
    strength: card.strength ?? null,
    willpower: card.willpower ?? null,
    lore: card.lore ?? null,
    moveCost: card.move_cost ?? null,
    text: card.text || '',
    keywords: card.keywords || [],
    illustrators: card.illustrators || [],
    layout: card.layout || 'normal',
    finishes: deriveFinishes(card),
  };
}

function fail(msg) {
  console.error(`\n❌ GATE FAILED: ${msg}`);
  process.exit(1);
}

async function main() {
  const storyIndex = await buildStoryIndex();

  console.log('🔎 Fetching set index...');
  const setsPayload = await getJSON(`${API}/sets`);
  // /sets returns { results: [...] }, but /sets/{code}/cards returns a bare array.
  const rawSets = setsPayload.results ?? setsPayload;
  console.log(`   ${rawSets.length} sets`);

  const sets = [];
  const cards = [];

  for (const s of rawSets) {
    const payload = await getJSON(`${API}/sets/${s.code}/cards`);
    const list = Array.isArray(payload) ? payload : payload.results ?? [];
    const missingImage = list.filter((c) => !c?.image_uris?.digital?.large).length;
    for (const c of list) cards.push(trimCard(c));
    sets.push({
      code: s.code,
      name: s.name,
      releasedAt: s.released_at || null,
      cardCount: list.length,
    });
    console.log(
      `   ${String(s.code).padStart(8)} ${String(list.length).padStart(4)} cards` +
        (missingImage ? `  ⚠️ ${missingImage} missing image` : '')
    );
    if (missingImage) fail(`set ${s.code} has ${missingImage} cards without a large image`);
  }

  for (const cs of CUSTOM_PROMO_SETS) {
    if (!sets.some((s) => s.code === cs.set.code)) {
      sets.push({
        code: cs.set.code,
        name: cs.set.name,
        releasedAt: cs.set.releasedAt || null,
        cardCount: cs.cards.length,
      });
      for (const c of cs.cards) cards.push(c);
      console.log(
        `   ${String(cs.set.code).padStart(8)} ${String(cs.cards.length).padStart(4)} cards (custom promo set)`
      );
    }
  }

  const passCounts = { exact: 0, name: 0, override: 0, none: 0 };
  const ambiguouslyResolved = [];
  for (const card of cards) {
    if (card.story) {
      passCounts.exact++;
      continue;
    }
    const { story, pass, ambiguous } = resolveStory(card, storyIndex);
    card.story = story;
    passCounts[pass]++;
    if (ambiguous) ambiguouslyResolved.push(card);
  }
  console.log(
    `   stories: ${passCounts.exact} exact, ${passCounts.name} by name, ` +
      `${passCounts.override} overridden, ${passCounts.none} unresolved`
  );

  // --- Gates ---
  if (cards.length !== EXPECTED_CARDS) fail(`expected ${EXPECTED_CARDS} cards, got ${cards.length}`);
  if (sets.length !== EXPECTED_SETS) fail(`expected ${EXPECTED_SETS} sets, got ${sets.length}`);
  const ids = new Set(cards.map((c) => c.id));
  if (ids.size !== cards.length) fail(`card ids are not unique (${ids.size} unique of ${cards.length})`);
  const noFinish = cards.filter((c) => !c.finishes.length);
  if (noFinish.length) fail(`${noFinish.length} cards have no finishes, e.g. ${noFinish[0].id}`);

  const noStory = cards.filter((c) => !c.story);
  if (noStory.length) {
    console.error('\nUnresolved stories — paste these into STORY_OVERRIDES:');
    for (const c of noStory) {
      console.error(`  '${c.id}': '', // ${c.name}${c.version ? ` – ${c.version}` : ''}`);
    }
    fail(`${noStory.length} of ${cards.length} cards have no story`);
  }
  if (ambiguouslyResolved.length) {
    console.error('\nResolved by a name that LorcanaJSON maps to more than one story:');
    for (const c of ambiguouslyResolved) {
      console.error(`  '${c.id}': '', // ${c.name}${c.version ? ` – ${c.version}` : ''} -> guessed ${c.story}`);
    }
    fail(`${ambiguouslyResolved.length} cards got a story from an ambiguous name; pin them in STORY_OVERRIDES`);
  }
  const storyNames = new Set(cards.map((c) => c.story));
  if (storyNames.size < MIN_STORIES) {
    fail(`only ${storyNames.size} distinct stories, expected at least ${MIN_STORIES}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
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

  const bytes = fs.statSync(cardsPath).size;
  console.log(`\n✅ ${cards.length} cards / ${sets.length} sets`);
  console.log(`   ${cardsPath}  ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ${setsPath}`);
  console.log(`   ${storiesPath}  ${stories.length} stories`);
  if (bytes > MAX_JSON_BYTES) fail(`lorcanaCards.json is ${(bytes / 1048576).toFixed(2)} MB (limit 3 MB)`);

  const finishHist = {};
  for (const c of cards) finishHist[c.finishes.join('+')] = (finishHist[c.finishes.join('+')] || 0) + 1;
  console.log('   finishes:', finishHist);
  console.log('   landscape:', cards.filter((c) => c.layout === 'landscape').length);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
