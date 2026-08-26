/**
 * Download every card image from the Lorcast CDN and emit two WebP tiers.
 *
 *   public/card-images/<setCode>/<collectorNumber>.webp     320w q78  (grid)
 *   public/card-images-lg/<setCode>/<collectorNumber>.webp  674w q82  (detail modal)
 *
 * `large` (674x940 AVIF) is Lorcast's maximum resolution, so there is no higher
 * tier to escalate to. Both dirs are gitignored — they live on R2 in production
 * and are only needed locally for `npm run dev`.
 *
 * Resumable: an existing non-empty output file is skipped, so a failed run can
 * simply be re-run. Pass --force to re-encode everything.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const API = 'https://api.lorcast.com/v0';
const CONCURRENCY = 12;
const FORCE = process.argv.includes('--force');

const TIERS = [
  { dir: 'public/card-images', width: 320, quality: 78 },
  { dir: 'public/card-images-lg', width: 674, quality: 82 },
];

async function getJSON(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 4) throw new Error(`${url} failed: ${err.message}`);
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return getJSON(url, attempt + 1);
  }
}

async function fetchBuffer(url, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, 700 * attempt));
    return fetchBuffer(url, attempt + 1);
  }
}

function outPath(tier, setCode, num) {
  return path.resolve(tier.dir, setCode, `${num}.webp`);
}

async function processCard(job) {
  const targets = TIERS.map((t) => ({ tier: t, file: outPath(t, job.setCode, job.num) }));
  const needed = FORCE
    ? targets
    : targets.filter((t) => !fs.existsSync(t.file) || fs.statSync(t.file).size === 0);
  if (!needed.length) return 'skipped';

  const src = await fetchBuffer(job.url);
  for (const { tier, file } of needed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(src)
      .resize({ width: tier.width, withoutEnlargement: true })
      .webp({ quality: tier.quality, effort: 5 })
      .toFile(file);
  }
  return 'written';
}

async function main() {
  console.log('🔎 Building job list from Lorcast...');
  const setsPayload = await getJSON(`${API}/sets`);
  const rawSets = setsPayload.results ?? setsPayload;

  const jobs = [];
  for (const s of rawSets) {
    const payload = await getJSON(`${API}/sets/${s.code}/cards`);
    const list = Array.isArray(payload) ? payload : payload.results ?? [];
    for (const c of list) {
      const url = c?.image_uris?.digital?.large;
      if (!url) throw new Error(`card ${s.code}-${c.collector_number} has no large image`);
      jobs.push({ setCode: s.code, num: String(c.collector_number), url });
    }
  }
  console.log(`📦 ${jobs.length} cards x ${TIERS.length} tiers\n`);

  let done = 0;
  let written = 0;
  let skipped = 0;
  const failures = [];
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const r = await processCard(job);
        if (r === 'written') written++;
        else skipped++;
      } catch (err) {
        failures.push({ id: `${job.setCode}-${job.num}`, error: err.message });
      }
      done++;
      if (done % 100 === 0 || done === jobs.length) {
        const pct = ((done / jobs.length) * 100).toFixed(1);
        process.stdout.write(
          `\r   ${done}/${jobs.length} (${pct}%)  written ${written}  skipped ${skipped}  failed ${failures.length}   `
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('\n');

  for (const tier of TIERS) {
    let count = 0;
    const root = path.resolve(tier.dir);
    if (fs.existsSync(root)) {
      for (const d of fs.readdirSync(root)) {
        const sub = path.join(root, d);
        if (fs.statSync(sub).isDirectory()) count += fs.readdirSync(sub).filter((f) => f.endsWith('.webp')).length;
      }
    }
    const bytes = Number(
      // du is fine here; this is a local-only diagnostic
      fs.existsSync(root) ? dirSize(root) : 0
    );
    console.log(
      `   ${tier.dir.padEnd(24)} ${String(count).padStart(5)} files  ${(bytes / 1048576).toFixed(0)} MB` +
        (count === jobs.length ? '  ✅' : `  ❌ expected ${jobs.length}`)
    );
  }

  if (failures.length) {
    console.error(`\n❌ ${failures.length} failures (re-run to retry):`);
    for (const f of failures.slice(0, 20)) console.error(`   ${f.id}: ${f.error}`);
    process.exit(1);
  }
  console.log('\n✅ all images present');
}

function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
