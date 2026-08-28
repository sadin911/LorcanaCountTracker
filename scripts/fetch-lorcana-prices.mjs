/**
 * Fetch latest Disney Lorcana card prices from Lorcast / TCGplayer API feeds.
 *
 * Emits:
 *   public/data/market_prices.json - Static fallback / client fetch
 *   src/data/market_prices.json    - Static bundled fallback
 */
import fs from 'fs';
import path from 'path';

const API = 'https://api.lorcast.com/v0';

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

function parsePrice(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

async function main() {
  console.log('💎 Fetching Disney Lorcana live market prices...');
  const setsPayload = await getJSON(`${API}/sets`);
  const rawSets = setsPayload.results ?? setsPayload;
  console.log(`   Found ${rawSets.length} sets`);

  const pricesMap = {};
  // Load existing prices if available to preserve manual PSA10 / overrides
  let existingPrices = {};
  try {
    const existingFile = path.resolve('public/data/market_prices.json');
    if (fs.existsSync(existingFile)) {
      const data = JSON.parse(fs.readFileSync(existingFile, 'utf8'));
      existingPrices = data.prices || {};
    }
  } catch {}

  let pricedCount = 0;
  let totalCards = 0;

  for (const s of rawSets) {
    const payload = await getJSON(`${API}/sets/${s.code}/cards`);
    const list = Array.isArray(payload) ? payload : payload.results ?? [];
    totalCards += list.length;

    for (const card of list) {
      const num = String(card.collector_number);
      const cardId = `${card.set.code}-${num}`;
      const regular = parsePrice(card.prices?.usd);
      const foil = parsePrice(card.prices?.usd_foil);
      const existing = existingPrices[cardId];

      // Calculate or preserve PSA 10 market price
      let psa10 = existing?.psa10 ?? null;
      if (psa10 === null || psa10 === undefined) {
        const rarity = card.rarity || '';
        const basePrice = foil ?? regular ?? 0;
        if (rarity === 'Enchanted' && basePrice > 0) {
          psa10 = Math.round(basePrice * 3.5 * 100) / 100;
        } else if (rarity === 'Promo' && basePrice > 10) {
          psa10 = Math.round(basePrice * 3.0 * 100) / 100;
        } else if (rarity === 'Legendary' && (foil ?? 0) >= 10) {
          psa10 = Math.round((foil ?? 0) * 2.8 * 100) / 100;
        } else if (basePrice >= 25) {
          psa10 = Math.round(basePrice * 2.5 * 100) / 100;
        }
      }

      if (regular !== null || foil !== null || psa10 !== null) {
        pricedCount++;
      }

      pricesMap[cardId] = {
        cardId,
        regular,
        foil,
        psa10,
        updatedAt: new Date().toISOString(),
        source: existing?.source === 'admin_manual' ? 'admin_manual' : 'lorcast',
      };
    }
    console.log(`   [Set ${s.code}] ${list.length} cards processed`);
  }

  const outputPayload = {
    updatedAt: new Date().toISOString(),
    totalPriced: pricedCount,
    totalCards,
    currency: 'USD',
    prices: pricesMap,
  };

  // Ensure public/data exists
  const publicDataDir = path.resolve('public/data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  const publicPath = path.join(publicDataDir, 'market_prices.json');
  fs.writeFileSync(publicPath, JSON.stringify(outputPayload, null, 2), 'utf8');

  // Also write to src/data for bundled fallback
  const srcDataDir = path.resolve('src/data');
  const srcPath = path.join(srcDataDir, 'market_prices.json');
  fs.writeFileSync(srcPath, JSON.stringify(outputPayload, null, 2), 'utf8');

  console.log(`\n✅ Saved market prices for ${pricedCount} / ${totalCards} cards`);
  console.log(`   -> ${publicPath}`);
  console.log(`   -> ${srcPath}`);
}

main().catch((err) => {
  console.error('❌ Failed to fetch prices:', err);
  process.exit(1);
});
