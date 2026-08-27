import { useState, useEffect, useRef, useCallback } from 'react';
import { isOverlayOpen } from './useScrollLock';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  maxPull = 110,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /* Kept in a ref so handleTouchEnd has a stable identity. onRefresh is rebuilt
     on every render by its caller, and the listener effect depends on the
     handlers — so without this all four touch listeners were torn down and
     re-attached on every render, including the ~60 renders a single pull causes
     through setPullDistance. */
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  /**
  const isThresholdMetRef = useRef(false);
  const hasVibratedRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const isAtTop = () => {
    if (isOverlayOpen()) return false;
    const scrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    return scrollY <= 5;
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing || e.touches.length !== 1) return;

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = false;
      hasVibratedRef.current = false;
      isThresholdMetRef.current = false;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing || disabled || e.touches.length !== 1) return;
      if (isOverlayOpen()) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // If user reached the top during scroll, recalibrate start point so pull begins naturally
      if (scrollTop <= 5 && startYRef.current < currentY && !isPullingRef.current) {
        startYRef.current = currentY;
        startXRef.current = currentX;
      }

      const rawDiffY = currentY - startYRef.current;
      const rawDiffX = currentX - startXRef.current;

      // Only pull downwards from top when vertical movement dominates
      if (rawDiffY > 0 && Math.abs(rawDiffY) > Math.abs(rawDiffX) * 1.1 && isAtTop()) {
        isPullingRef.current = true;
        // Non-linear damping for a natural rubber-band resistance
        const dampened = Math.min(maxPull, Math.pow(rawDiffY, 0.85) * 1.9);
        pullDistanceRef.current = dampened;
        setPullDistance(dampened);
        setIsPulling(true);

        const met = dampened >= threshold;
        if (met && !hasVibratedRef.current) {
          triggerHaptic(18); // Subtle notch when threshold is reached
          hasVibratedRef.current = true;
        } else if (!met && hasVibratedRef.current) {
          hasVibratedRef.current = false;
        }
        isThresholdMetRef.current = met;

        // Prevent browser overscroll bounce if pulling actively
        if (dampened > 8 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        // Swiping up or sideways: reset only if we were actively pulling
        if (isPullingRef.current || pullDistanceRef.current > 0) {
          isPullingRef.current = false;
          pullDistanceRef.current = 0;
          setPullDistance(0);
          setIsPulling(false);
        }
      }
    },
    [disabled, isRefreshing, maxPull, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current && pullDistanceRef.current === 0) return;

    const triggered = pullDistanceRef.current >= threshold;
    isPullingRef.current = false;
    setIsPulling(false);

    if (triggered && !isRefreshing) {
      triggerHaptic(30); // Action trigger vibration
      setIsRefreshing(true);
      setPullDistance(threshold * 0.85); // Lock at spinner height during sync

      try {
        await Promise.all([
          Promise.resolve(onRefresh()),
          new Promise((resolve) => setTimeout(resolve, 650)), // Smooth minimum display duration
        ]);
        setIsSuccess(true);
        triggerHaptic([15, 40, 20]); // Dual success feedback
      } catch (err) {
        console.error('Pull-to-refresh action failed:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setIsSuccess(false);
          setPullDistance(0);
          pullDistanceRef.current = 0;
          isThresholdMetRef.current = false;
        }, 500);
      }
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, [isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    isSuccess,
    isThresholdMet: pullDistance >= threshold,
    progress: Math.min(1, pullDistance / threshold),
  };
}
