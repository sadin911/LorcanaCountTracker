import { useCallback, useEffect, useRef } from 'react';

/**
 * Pointer-tracked 3D tilt for premium (foil-only) cards.
 *
 * What sells the illusion is not the rotation on its own — it is that the
 * specular highlight and the holographic bands move *against* the tilt, the way
 * light does on a real foil card. So this hook publishes both: the rotation, and
 * the pointer position the CSS uses to place the highlight.
 *
 * Everything is written to CSS custom properties on the element rather than to
 * React state. A grid can hold sixty of these, and re-rendering a card on every
 * pointermove would be the one thing guaranteed to make it feel cheap.
 */

/** Degrees at the very edge of the card. Past ~12° the card reads as broken. */
const MAX_TILT_DEG = 12;

/** Snappy while the pointer drives it, unhurried on the way back to rest. */
const TRACK_MS = 70;
const RELEASE_MS = 420;

export function useFoilTilt<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null);
  const frame = useRef(0);
  /**
   * Tilt is a hover affordance. On a touch screen a pointermove is a scroll
   * gesture, and tilting the card under the finger fights the scroll.
   */
  const interactive = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      interactive.current = fine.matches && !reduced.matches;
    };
    sync();
    fine.addEventListener('change', sync);
    reduced.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      reduced.removeEventListener('change', sync);
    };
  }, [enabled]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback((e: { clientX: number; clientY: number }) => {
    if (!interactive.current) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const ry = (px - 0.5) * 2 * MAX_TILT_DEG;
      const rx = (0.5 - py) * 2 * MAX_TILT_DEG;
      el.style.setProperty('--foil-mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--foil-my', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--foil-ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--foil-rx', `${rx.toFixed(2)}deg`);
      // Shadow offsets in px, because CSS calc() cannot divide a deg by a deg to
      // get back to a plain number.
      el.style.setProperty('--foil-sx', `${(-ry * 1.1).toFixed(1)}px`);
      el.style.setProperty('--foil-sy', `${(rx * 1.1 + 10).toFixed(1)}px`);
      el.style.setProperty('--foil-on', '1');
      el.style.setProperty('--foil-dur', `${TRACK_MS}ms`);
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--foil-dur', `${RELEASE_MS}ms`);
    el.style.setProperty('--foil-on', '0');
    el.style.setProperty('--foil-rx', '0deg');
    el.style.setProperty('--foil-ry', '0deg');
    el.style.setProperty('--foil-sx', '0px');
    el.style.setProperty('--foil-sy', '10px');
    el.style.setProperty('--foil-mx', '50%');
    el.style.setProperty('--foil-my', '50%');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
