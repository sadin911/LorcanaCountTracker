import { useState, useEffect, useRef, useCallback } from 'react';

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

  const startYRef = useRef(0);
  const isEligibleRef = useRef(false);
  const isThresholdMetRef = useRef(false);
  const hasVibratedRef = useRef(false);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Only engage if at the absolute top of the page
      if (window.scrollY <= 2) {
        startYRef.current = e.touches[0].clientY;
        isEligibleRef.current = true;
        hasVibratedRef.current = false;
        isThresholdMetRef.current = false;
      } else {
        isEligibleRef.current = false;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEligibleRef.current || isRefreshing || disabled) return;

      const currentY = e.touches[0].clientY;
      const rawDiff = currentY - startYRef.current;

      // Only pull downwards from top
      if (rawDiff > 0 && window.scrollY <= 0) {
        // Non-linear damping for a natural iOS/Android rubber-band resistance
        const dampened = Math.min(maxPull, Math.pow(rawDiff, 0.82) * 2.2);
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
        if (dampened > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    },
    [disabled, isRefreshing, maxPull, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isEligibleRef.current || isRefreshing || disabled) return;

    isEligibleRef.current = false;
    setIsPulling(false);

    if (isThresholdMetRef.current) {
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
          isThresholdMetRef.current = false;
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

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
