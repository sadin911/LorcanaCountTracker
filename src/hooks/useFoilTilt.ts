import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 3D tilt for premium (foil-only) cards, driven by the pointer on a desktop and
 * by the device gyroscope on a phone.
 *
 * Both inputs hold their angle. A pointer says where you are looking, so the card
 * stays leaned while the cursor sits on it; a gyroscope says how the phone is
 * being held, so the card stays leaned until the phone is levelled again. Neither
 * springs back on its own.
 *
 * What sells the illusion is not the rotation on its own — it is that the
 * specular highlight and the holographic bands move *against* the tilt, the way
 * light does on a real foil card. So this hook publishes both: the rotation, and
 * the position the CSS uses to place the highlight.
 *
 * One hook owns every `--foil-*` property on the element. Pointer and gyro are
 * gated on mutually exclusive media queries, but routing both through a single
 * writer means there is no arrangement in which two sources fight over the same
 * variable.
 *
 * Everything is written straight to CSS custom properties rather than to React
 * state. A grid can hold sixty of these, and re-rendering a card on every
 * pointermove would be the one thing guaranteed to make it feel cheap.
 */

/**
 * Degrees at the extremes. Deliberately shallow: the light is meant to carry this
 * effect, and the rotation only exists to give the reflection something to slide
 * against. Past ~5° the card starts looking like a rotated picture rather than a
 * glossy one.
 */
const MAX_TILT_DEG = 3.5;

/** Snappy while an input drives it, unhurried on the way back to rest. */
const TRACK_MS = 70;
const RELEASE_MS = 420;

/**
 * Device degrees to card degrees. Well below 1:1 so a full lean takes about 10°
 * of wrist — a deliberate movement rather than a twitch.
 */
const GYRO_GAIN = 0.35;

/** Sensor wrap-around (gamma flips through ±90) shows up as an absurd delta. */
const GYRO_MAX_DELTA_DEG = 45;

/**
 * Degrees away from where you were holding the phone that still count as holding
 * it steady. A hand at rest wobbles a few tenths of a degree and a phone in a
 * moving car never stops moving at all; without this the card twitches
 * constantly. Subtracted from the deviation rather than compared against it, so
 * crossing the threshold eases in instead of jumping.
 */
const GYRO_DEADZONE_DEG = 0.8;

/** Low-pass filter on the sensor. Raw readings are noisy enough to shimmer. */
const GYRO_SMOOTHING = 0.16;

/**
 * The card should behave like a physical card held behind the glass, staying
 * level in the world while the phone turns around it — so its rotation is the
 * opposite of the device's. Flip this if it reads inverted on a real handset;
 * a sensor is the one thing that cannot be checked in a headless browser.
 */
const GYRO_SIGN = -1;

export type GyroStatus = 'unsupported' | 'idle' | 'active' | 'denied';

interface Options {
  /**
   * Allow the gyroscope to drive the tilt on touch devices. Off by default: it
   * belongs on a card being examined on its own, not on sixty grid tiles
   * tilting in unison every time the phone moves.
   */
  gyro?: boolean;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<PermissionState | 'granted' | 'denied'>;
}

export function useFoilTilt<T extends HTMLElement>(enabled: boolean, options: Options = {}) {
  const { gyro: gyroAllowed = false } = options;

  const ref = useRef<T | null>(null);
  const frame = useRef(0);

  /**
   * Pointer tilt is a hover affordance. On a touch screen a pointermove is a
   * scroll gesture, and tilting the card under the finger fights the scroll.
   */
  const pointerDrives = useRef(false);
  const reducedMotion = useRef(false);
  const [gyroStatus, setGyroStatus] = useState<GyroStatus>('unsupported');

  const write = useCallback((rx: number, ry: number, mx: number, my: number, on: number, durMs: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--foil-rx', `${rx.toFixed(2)}deg`);
    el.style.setProperty('--foil-ry', `${ry.toFixed(2)}deg`);
    el.style.setProperty('--foil-mx', `${mx.toFixed(1)}%`);
    el.style.setProperty('--foil-my', `${my.toFixed(1)}%`);
    // Shadow offsets in px, because CSS calc() cannot divide a deg by a deg to
    // get back to a plain number.
    el.style.setProperty('--foil-sx', `${(-ry * 1.1).toFixed(1)}px`);
    el.style.setProperty('--foil-sy', `${(rx * 1.1 + 10).toFixed(1)}px`);
    el.style.setProperty('--foil-on', String(on));
    el.style.setProperty('--foil-dur', `${durMs}ms`);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedMotion.current = reduced.matches;
      pointerDrives.current = fine.matches && !reduced.matches;
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

  // --- Pointer ---------------------------------------------------------------

  const onPointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      if (!pointerDrives.current) return;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        write(
          (0.5 - py) * 2 * MAX_TILT_DEG,
          (px - 0.5) * 2 * MAX_TILT_DEG,
          px * 100,
          py * 100,
          1,
          TRACK_MS
        );
      });
    },
    [write]
  );

  const onPointerLeave = useCallback(() => {
    if (!pointerDrives.current) return;
    cancelAnimationFrame(frame.current);
    write(0, 0, 50, 50, 0, RELEASE_MS);
  }, [write]);

  // --- Gyroscope -------------------------------------------------------------

  useEffect(() => {
    if (!enabled || !gyroAllowed) return;
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setGyroStatus('unsupported');
      return;
    }
    // A phone that reports a fine pointer is a phone with a mouse attached; let
    // the pointer drive in that case.
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setGyroStatus(coarse && !reduced ? 'idle' : 'unsupported');
  }, [enabled, gyroAllowed]);

  const listening = useRef(false);

  const startGyro = useCallback(() => {
    if (listening.current) return undefined;
    listening.current = true;

    /* First reading becomes neutral: nobody holds a phone at beta 0, so absolute
       angles would start the card pinned at full tilt. */
    let baseline: { beta: number; gamma: number } | null = null;
    const smoothed = { rx: 0, ry: 0 };
    const clamp = (v: number) => Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, v));

    const onOrientation = (e: DeviceOrientationEvent) => {
      const { beta, gamma } = e;
      if (beta === null || gamma === null) return;
      if (!baseline) {
        baseline = { beta, gamma };
        return;
      }

      let dx = beta - baseline.beta;
      let dy = gamma - baseline.gamma;
      if (Math.abs(dx) > GYRO_MAX_DELTA_DEG || Math.abs(dy) > GYRO_MAX_DELTA_DEG) return;

      /* Dead zone on the deviation vector, not per axis, so a slight diagonal
         lean is treated the same as a slight lean along either axis. */
      const off = Math.hypot(dx, dy);
      if (off <= GYRO_DEADZONE_DEG) {
        dx = 0;
        dy = 0;
      } else {
        const past = (off - GYRO_DEADZONE_DEG) / off;
        dx *= past;
        dy *= past;
      }

      /* Remap for the screen's own rotation, or a phone held sideways tilts the
         card along the wrong axis. */
      const angle = window.screen?.orientation?.angle ?? 0;
      if (angle === 90) [dx, dy] = [dy, -dx];
      else if (angle === 180) [dx, dy] = [-dx, -dy];
      else if (angle === 270) [dx, dy] = [-dy, dx];

      /* Absolute: the card holds whatever lean the phone is being held at, and
         only returns to level when the phone does. It does not spring back on its
         own. */
      const targetRx = clamp(GYRO_SIGN * dx * GYRO_GAIN);
      const targetRy = clamp(GYRO_SIGN * dy * GYRO_GAIN);
      smoothed.rx += (targetRx - smoothed.rx) * GYRO_SMOOTHING;
      smoothed.ry += (targetRy - smoothed.ry) * GYRO_SMOOTHING;

      const { rx, ry } = smoothed;
      const lean = Math.min(1, Math.hypot(rx, ry) / (MAX_TILT_DEG * 0.6));
      /* Highlight tracks the lean so the bands slide against the rotation — the
         parallax the eye reads as depth. */
      write(rx, ry, 50 + (ry / MAX_TILT_DEG) * 45, 50 - (rx / MAX_TILT_DEG) * 45, lean, TRACK_MS);
    };

    window.addEventListener('deviceorientation', onOrientation);
    setGyroStatus('active');
    return onOrientation;
  }, [write]);

  const stopGyroRef = useRef<((e: DeviceOrientationEvent) => void) | undefined>(undefined);

  const enableGyro = useCallback(async () => {
    const Ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    // iOS 13+ gates the sensor behind a permission prompt that only a user
    // gesture may open, which is why this is a button and not an effect.
    if (typeof Ctor?.requestPermission === 'function') {
      try {
        const result = await Ctor.requestPermission();
        if (result !== 'granted') {
          setGyroStatus('denied');
          return;
        }
      } catch {
        setGyroStatus('denied');
        return;
      }
    }
    stopGyroRef.current = startGyro();
  }, [startGyro]);

  /* Android needs no prompt, so there the tilt starts on its own. */
  useEffect(() => {
    if (gyroStatus !== 'idle') return;
    const Ctor = window.DeviceOrientationEvent as unknown as DeviceOrientationEventStatic | undefined;
    if (typeof Ctor?.requestPermission === 'function') return;
    stopGyroRef.current = startGyro();
  }, [gyroStatus, startGyro]);

  useEffect(
    () => () => {
      if (stopGyroRef.current) window.removeEventListener('deviceorientation', stopGyroRef.current);
      listening.current = false;
    },
    []
  );

  return {
    ref,
    onPointerMove,
    onPointerLeave,
    gyro: {
      /** 'idle' means available but waiting on the iOS permission gesture. */
      status: gyroStatus,
      enable: enableGyro,
      needsGesture: gyroStatus === 'idle',
    },
  };
}
