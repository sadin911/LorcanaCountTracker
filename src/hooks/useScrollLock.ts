import { useEffect } from 'react';

/**
 * Stop the page behind an overlay from scrolling for as long as the overlay is
 * mounted.
 *
 * Reference counted, because overlays nest: the card detail modal opens the
 * fullscreen artwork viewer on top of itself, and the naive version unlocks the
 * page the moment either one unmounts.
 *
 * `overflow: hidden` on both elements rather than `position: fixed` on the body.
 * Fixing the body is the more thorough lock, but it resets scrollY to 0, which
 * silently arms pull-to-refresh under the overlay — the page thinks it is at the
 * top. This keeps the scroll position honest instead, and the overlays carry
 * `touch-none` so a drag on them is never read as a scroll gesture.
 *
 * The `data-overlay-open` attribute is the signal other listeners use to stand
 * down; see usePullToRefresh.
 */

let depth = 0;
let restore: (() => void) | null = null;

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;

    depth += 1;
    if (depth === 1) {
      const html = document.documentElement;
      const { body } = document;
      const prevHtml = html.style.overflow;
      const prevBody = body.style.overflow;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.dataset.overlayOpen = 'true';
      restore = () => {
        html.style.overflow = prevHtml;
        body.style.overflow = prevBody;
        delete body.dataset.overlayOpen;
      };
    }

    return () => {
      depth -= 1;
      if (depth === 0 && restore) {
        restore();
        restore = null;
      }
    };
  }, [active]);
}

/** True while any overlay using useScrollLock is mounted. */
export function isOverlayOpen(): boolean {
  return typeof document !== 'undefined' && document.body.dataset.overlayOpen === 'true';
}
