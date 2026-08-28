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

      if (regular !== null || foil !== null) {
        pricedCount++;
      }

      pricesMap[cardId] = {
        cardId,
        regular,
        foil,
        updatedAt: new Date().toISOString(),
        source: 'lorcast',
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
