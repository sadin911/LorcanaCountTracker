/**
 * Fetch the full Disney Lorcana catalogue from the Lorcast API and emit two
 * trimmed JSON files that the app statically imports:
 *
 *   src/data/lorcanaSets.json   - set index
 *   src/data/lorcanaCards.json  - every card, trimmed
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

const EXPECTED_SETS = 22;
const EXPECTED_CARDS = 3192;

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

  // --- Gates ---
  if (cards.length !== EXPECTED_CARDS) fail(`expected ${EXPECTED_CARDS} cards, got ${cards.length}`);
  if (sets.length !== EXPECTED_SETS) fail(`expected ${EXPECTED_SETS} sets, got ${sets.length}`);
  const ids = new Set(cards.map((c) => c.id));
  if (ids.size !== cards.length) fail(`card ids are not unique (${ids.size} unique of ${cards.length})`);
  const noFinish = cards.filter((c) => !c.finishes.length);
  if (noFinish.length) fail(`${noFinish.length} cards have no finishes, e.g. ${noFinish[0].id}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cardsPath = path.join(OUT_DIR, 'lorcanaCards.json');
  const setsPath = path.join(OUT_DIR, 'lorcanaSets.json');
  fs.writeFileSync(cardsPath, JSON.stringify(cards));
  fs.writeFileSync(setsPath, JSON.stringify(sets, null, 2));

  const bytes = fs.statSync(cardsPath).size;
  console.log(`\n✅ ${cards.length} cards / ${sets.length} sets`);
  console.log(`   ${cardsPath}  ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ${setsPath}`);
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
