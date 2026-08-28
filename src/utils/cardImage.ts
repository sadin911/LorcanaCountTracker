/**
 * Card image URLs are DERIVED from setCode + collectorNumber, never stored per
 * card, so the catalogue JSON stays ~1.75 MB instead of triple that.
 *
 * Two tiers, both WebP (see scripts/download-lorcana-images.mjs):
 *   card-images/<setCode>/<num>.webp     320w  grid thumbnails
 *   card-images-lg/<setCode>/<num>.webp  674w  detail modal / zoom
 *
 * Dev serves them from public/; production serves them from Cloudflare R2.
 */

export const DEFAULT_R2_CDN = 'https://pub-106d2a10ead74810a7ea0e381ff1f0e1.r2.dev';

const RAW_CDN_BASE = (import.meta.env.VITE_R2_CDN_BASE || DEFAULT_R2_CDN).replace(/\/+$/, '');

const BASE_URL = import.meta.env.BASE_URL || '/';

export const DEFAULT_CARD_PLACEHOLDER = `${BASE_URL.replace(/\/+$/, '')}/card-placeholder.svg`;

function localUrl(key: string): string {
  return `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}${key}`;
}

/** Object key relative to public/ — also the R2 key. */
export function cardImageKey(setCode: string, collectorNumber: string, large = false): string {
  const dir = large ? 'card-images-lg' : 'card-images';
  return `${dir}/${setCode}/${collectorNumber}.webp`;
}

export function resolveCardImageUrl(setCode?: string | null, collectorNumber?: string | null, large = false): string {
  if (!setCode || !collectorNumber) return DEFAULT_CARD_PLACEHOLDER;
  const key = cardImageKey(setCode, collectorNumber, large);
  return RAW_CDN_BASE ? `${RAW_CDN_BASE}/${key}` : localUrl(key);
}

/**
 * Fallback chain on <img> error: large -> thumbnail -> R2 CDN -> placeholder.
 * `large` is Lorcast's maximum resolution, so there is nothing above it.
 */
export function handleCardImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  setCode?: string | null,
  collectorNumber?: string | null
) {
  const target = e.currentTarget;
  if (!target) return;
  // Stop the loop once we're already showing the placeholder.
  if (target.src.includes('card-placeholder.svg')) return;

  // 1. If large failed, cascade to thumbnail
  if (setCode && collectorNumber && target.src.includes('card-images-lg/')) {
    const thumb = resolveCardImageUrl(setCode, collectorNumber, false);
    if (target.src !== thumb) {
      target.src = thumb;
      return;
    }
  }

  // 2. If thumbnail failed on local or custom domain, cascade to default R2 CDN
  if (setCode && collectorNumber && !target.src.includes(DEFAULT_R2_CDN)) {
    const r2Thumb = `${DEFAULT_R2_CDN}/card-images/${setCode}/${collectorNumber}.webp`;
    if (target.src !== r2Thumb) {
      target.src = r2Thumb;
      return;
    }
  }

  // 3. Final fallback: Card placeholder SVG
  target.src = DEFAULT_CARD_PLACEHOLDER;
}

