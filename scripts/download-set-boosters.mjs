/**
 * Download one booster-pack cover per Lorcana set, convert it to WebP and write
 * the setCode -> path map the app reads.
 *
 * Only the 13 numbered expansions are listed. The promo and special sets — P1,
 * P2, P3, cp, C2, D23, DIS, Coconut, PD1 — have no retail booster product at
 * all: they are convention exclusives, challenge prizes and promo inserts. The
 * URLs previously listed for them pointed at unrelated products (a starter set,
 * another set's box) or reused one placeholder URL across several sets, so seven
 * of them shipped byte-identical art. Showing no pack is more honest than
 * showing the wrong one, and src/utils/boosterImages.ts returns null for an
 * unmapped set, which hides the trigger.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT_DIR = path.resolve('public/set-boosters');
const JSON_OUT = path.resolve('src/data/setBoosterImages.json');

const SET_BOOSTER_SOURCES = [
  {
    code: '1',
    name: 'The First Chapter',
    urls: [
      'https://m.media-amazon.com/images/I/91HkC31hwDL._AC_SL1500_.jpg',
      'https://ravensburger.cloud/cms/gallery/s1-booster-wraps.png'
    ]
  },
  {
    code: '2',
    name: 'Rise of the Floodborn',
    urls: [
      'https://m.media-amazon.com/images/I/81gtdVknzLL.jpg',
      'https://m.media-amazon.com/images/I/71k4o7q2LlL._AC_SL1200_.jpg'
    ]
  },
  {
    code: '3',
    name: 'Into the Inklands',
    urls: [
      'https://ravensburger.cloud/cms/gallery/lorcana-web/product-s3/en_brp1nnq4m1.png',
      'https://m.media-amazon.com/images/I/71N7eWqj0mL._AC_SL1200_.jpg'
    ]
  },
  {
    code: '4',
    name: "Ursula's Return",
    urls: [
      'https://m.media-amazon.com/images/I/71MgY-zSoYL._AC_SL1200_.jpg',
      'https://m.media-amazon.com/images/I/71k0OaF4m8L._AC_SL1200_.jpg'
    ]
  },
  {
    code: '5',
    name: 'Shimmering Skies',
    urls: [
      'https://m.media-amazon.com/images/I/71oupFFvM7L.jpg',
      'https://m.media-amazon.com/images/I/71PfZoI5jUL._AC_SL1200_.jpg'
    ]
  },
  {
    code: '6',
    name: 'Azurite Sea',
    urls: [
      'https://tcgplayer-cdn.tcgplayer.com/product/578095_in_1000x1000.jpg',
      'https://www.despelvogel.com/wp-content/uploads/2025/01/AzuriteSeaBooster.png'
    ]
  },
  {
    code: '7',
    name: "Archazia's Island",
    urls: [
      'https://tcgstore.se/cdn/shop/files/disney-lorcana-archazia_s-island-booster-pack.jpg?v=1738872493&width=1200',
      'https://m.media-amazon.com/images/I/71v4uW2J5QL._AC_SL1200_.jpg'
    ]
  },
  {
    code: '8',
    name: 'Reign of Jafar',
    urls: [
      'https://cdn.shoplightspeed.com/shops/615789/files/69917711/disney-lorcana-8-reign-of-jafar-booster-pack-x24-e.jpg'
    ]
  },
  {
    code: '9',
    name: 'Fabled',
    urls: [
      'https://thegameshoppe.com/wp-content/uploads/2025/07/Lorcana_Fabled_01c_booster-pack2.jpg'
    ]
  },
  {
    code: '10',
    name: 'Whispers in the Well',
    urls: [
      'https://www.lautapelit.fi/tuotekuvat/1200x1200/Lorcana%20-%20Whispers%20in%20the%20Well%20Demona.png',
      'https://www.lautapelit.fi/tuotekuvat/1200x1200/Lorcana%20-%20Whispers%20in%20the%20Well%20Daisy.png'
    ]
  },
  {
    code: '11',
    name: 'Winterspell',
    urls: [
      'https://cdn.cardsrealm.com/images/cartas/11-winterspell/EN/med/disney-lorcana-winterspell-booster-pack-.png?5352'
    ]
  },
  {
    code: '12',
    name: 'Wilds Unknown',
    urls: [
      'https://grimdice.co.uk/cdn/shop/files/00.grimTemplate_a695cac6-ce36-4d5d-a875-cec781c7b841_grande.jpg?v=1774093684'
    ]
  },
  {
    code: '13',
    name: 'Attack of the Vine!',
    urls: [
      'https://tcgplayer-cdn.tcgplayer.com/product/690386_in_1000x1000.jpg'
    ]
  }
];

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const boosterMap = {};

  console.log(`📦 Processing booster pack images for ${SET_BOOSTER_SOURCES.length} Lorcana sets...\n`);

  for (const set of SET_BOOSTER_SOURCES) {
    let success = false;
    for (const url of set.urls) {
      try {
        console.log(`⏳ Downloading Set ${set.code} (${set.name}) from ${url}...`);
        const rawBuffer = await downloadImage(url);

        const webpBuffer = await sharp(rawBuffer)
          .resize({ height: 800, width: 600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 90, effort: 4 })
          .toBuffer();

        const outFileName = `${set.code}.webp`;
        const outFilePath = path.join(OUT_DIR, outFileName);
        fs.writeFileSync(outFilePath, webpBuffer);

        const relPath = `/set-boosters/${outFileName}`;
        boosterMap[set.code] = relPath;
        boosterMap[set.code.toUpperCase()] = relPath;
        boosterMap[set.code.toLowerCase()] = relPath;

        console.log(`✅ Saved ${outFileName} (${(webpBuffer.length / 1024).toFixed(1)} KB)`);
        success = true;
        break;
      } catch (err) {
        console.warn(`   ⚠️ Failed url ${url}: ${err.message}`);
      }
    }

    if (!success) {
      console.error(`❌ Could not download booster pack for Set ${set.code} (${set.name})`);
    }
  }

  fs.writeFileSync(JSON_OUT, JSON.stringify(boosterMap, null, 2), 'utf-8');
  console.log(`\n✨ Successfully generated ${JSON_OUT} with ${Object.keys(boosterMap).length} mappings!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
