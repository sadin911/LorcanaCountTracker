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

const RAW_CDN_BASE = (import.meta.env.VITE_R2_CDN_BASE || '').replace(/\/+$/, '');

const BASE_URL = import.meta.env.BASE_URL || '/';

/*
 * A production build with no CDN base falls back to public/card-images/, which
 * is gitignored and therefore absent from the deployed artifact — every card
 * would 404 with nothing in the console to explain it. Say so loudly, the same
 * way firebase.ts does for a missing Firebase config.
 */
if (import.meta.env.PROD && !RAW_CDN_BASE) {
  console.error(
    '[cardImage] VITE_R2_CDN_BASE is not set. Card images are served from the R2 bucket in ' +
      'production and are not bundled, so every card image will 404. Set it as a build-time env var.'
  );
}

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
  // Fall back to local files whenever no CDN is configured, so a fresh clone
  // works with `npm run data:images` alone.
  return RAW_CDN_BASE ? `${RAW_CDN_BASE}/${key}` : localUrl(key);
}

/**
 * Fallback chain on <img> error: large -> thumbnail -> placeholder.
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

  if (setCode && collectorNumber && target.src.includes('card-images-lg/')) {
    const thumb = resolveCardImageUrl(setCode, collectorNumber, false);
    if (target.src !== thumb) {
      target.src = thumb;
      return;
    }
  }

  target.src = DEFAULT_CARD_PLACEHOLDER;
}
