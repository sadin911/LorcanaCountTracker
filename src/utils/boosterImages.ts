import boosterMapData from '../data/setBoosterImages.json';

const boosterMap: Record<string, string> = boosterMapData;
const RAW_CDN_BASE = (import.meta.env.VITE_R2_CDN_BASE || '').replace(/\/+$/, '');
const BASE_URL = import.meta.env.BASE_URL || '/';

function localUrl(path: string): string {
  const clean = path.replace(/^\/+/, '');
  return `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}${clean}`;
}

/**
 * Resolves a set's booster pack cover image to its best URL.
 * - In Production with R2 CDN: points to Cloudflare R2 CDN (`${RAW_CDN_BASE}/set-boosters/${code}.webp`).
 * - In Local Dev or fallback: uses local asset path `/set-boosters/${code}.webp`.
 */
export function getSetBoosterImage(setCode?: string | null): string | null {
  if (!setCode) return null;
  const clean = setCode.trim();
  const found = boosterMap[clean] || boosterMap[clean.toUpperCase()] || boosterMap[clean.toLowerCase()];
  if (!found) return null;

  const filename = found.replace(/^\/?set-boosters\//, '').replace(/\.(png|jpg|jpeg|webp)$/, '.webp');
  const relativePath = `set-boosters/${filename}`;

  if (import.meta.env.PROD && RAW_CDN_BASE) {
    return `${RAW_CDN_BASE}/${relativePath}`;
  }

  return localUrl(relativePath);
}

/**
 * Fallback error handler for booster pack image loading.
 * Hierarchy: Cloudflare R2 CDN WebP -> Local /set-boosters/
 */
export function handleBoosterImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  setCode?: string | null
) {
  const target = e.currentTarget;
  if (!target || !setCode) return;

  const filename = `${setCode.trim()}.webp`;
  const r2Url = RAW_CDN_BASE ? `${RAW_CDN_BASE}/set-boosters/${filename}` : null;
  const local = localUrl(`set-boosters/${filename}`);

  if (r2Url && target.src !== r2Url) {
    target.src = r2Url;
  } else if (target.src !== local) {
    target.src = local;
  }
}
