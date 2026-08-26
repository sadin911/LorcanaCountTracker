/**
 * Upload the two local WebP tiers to a Cloudflare R2 bucket.
 *
 * Credentials come from a gitignored secret.yaml at the repo root:
 *   AccessKey: ...
 *   Secret: ...
 *   S3Endpoint: https://<account>.r2.cloudflarestorage.com
 *   Bucket: <bucket name>
 *
 * Object keys are relative to public/, e.g. card-images/1/125.webp, matching
 * what src/utils/cardImage.ts builds in production.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const CONCURRENCY = 30;
const SOURCE_DIRS = ['public/card-images', 'public/card-images-lg'];

const SECRET_FILE = 'secret.yaml';
if (!fs.existsSync(SECRET_FILE)) {
  console.error(`❌ ${SECRET_FILE} not found. Create it with AccessKey / Secret / S3Endpoint.`);
  process.exit(1);
}
const raw = fs.readFileSync(SECRET_FILE, 'utf-8');
const accessKeyId = raw.match(/AccessKey:\s*([^\r\n]+)/)?.[1]?.trim();
const secretAccessKey = raw.match(/Secret:\s*([^\r\n]+)/)?.[1]?.trim();
const endpoint = raw.match(/S3Endpoint:\s*([^\r\n]+)/)?.[1]?.trim();
// Bucket lives with the credentials rather than hardcoded, so renaming the
// bucket never means editing this script.
const BUCKET_NAME = process.env.R2_BUCKET || raw.match(/Bucket:\s*([^\r\n]+)/)?.[1]?.trim();

for (const [k, v] of Object.entries({ accessKeyId, secretAccessKey, endpoint, BUCKET_NAME })) {
  if (!v) {
    console.error(`❌ ${SECRET_FILE} is missing ${k}`);
    process.exit(1);
  }
}

const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });

function getAllFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) getAllFiles(p, out);
    else if (e.name.endsWith('.webp')) out.push(p);
  }
  return out;
}

async function upload(file) {
  const key = path.relative(path.resolve('public'), path.resolve(file)).replace(/\\/g, '/');
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
}

async function main() {
  const files = SOURCE_DIRS.flatMap((d) => getAllFiles(path.resolve(d)));
  if (!files.length) {
    console.error('❌ no .webp files found. Run `npm run data:images` first.');
    process.exit(1);
  }
  console.log(`📦 uploading ${files.length} objects to R2 bucket "${BUCKET_NAME}"\n`);

  let done = 0;
  const failures = [];
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const f = files[cursor++];
      try {
        await upload(f);
      } catch (err) {
        failures.push({ f, error: err.message });
      }
      done++;
      if (done % 100 === 0 || done === files.length) {
        process.stdout.write(
          `\r   ${done}/${files.length} (${((done / files.length) * 100).toFixed(1)}%)  failed ${failures.length}   `
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('\n');

  if (failures.length) {
    console.error(`❌ ${failures.length} uploads failed:`);
    for (const f of failures.slice(0, 20)) console.error(`   ${f.f}: ${f.error}`);
    process.exit(1);
  }
  console.log(`✅ ${files.length} objects uploaded to "${BUCKET_NAME}"`);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
