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
  threshold = 58,
  maxPull = 95,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const isThresholdMetRef = useRef(false);
  const hasVibratedRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const startedAtTopRef = useRef(false);

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
      if (isOverlayOpen()) return;

      const top = isAtTop();
      startedAtTopRef.current = top;
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = false;
      hasVibratedRef.current = false;
      isThresholdMetRef.current = false;
      pullDistanceRef.current = 0;
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

      // If user started touch while scrolled down, but scrolled to top during this touch:
      if (!startedAtTopRef.current && scrollTop <= 5) {
        startedAtTopRef.current = true;
        startYRef.current = currentY;
        startXRef.current = currentX;
        return;
      }

      if (!startedAtTopRef.current || !isAtTop()) {
        if (isPullingRef.current || pullDistanceRef.current > 0) {
          isPullingRef.current = false;
          pullDistanceRef.current = 0;
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      const rawDiffY = currentY - startYRef.current;
      const rawDiffX = currentX - startXRef.current;

      // Only pull downwards from top when vertical movement dominates
      if (rawDiffY > 0 && Math.abs(rawDiffY) > Math.abs(rawDiffX)) {
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

        // Prevent browser overscroll bounce when pulling actively
        if (e.cancelable) {
          e.preventDefault();
        }
      } else if (rawDiffY <= 0) {
        // Pushing up above top
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
    if (!isPullingRef.current && pullDistanceRef.current === 0) {
      startedAtTopRef.current = false;
      return;
    }

    const triggered = pullDistanceRef.current >= threshold;
    isPullingRef.current = false;
    startedAtTopRef.current = false;
    setIsPulling(false);

    if (triggered && !isRefreshing) {
      triggerHaptic(30); // Action trigger vibration
      setIsRefreshing(true);
      setPullDistance(threshold * 0.85); // Lock at spinner height during sync

      try {
        await Promise.all([
          Promise.resolve(onRefreshRef.current()),
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
  }, [isRefreshing, threshold]);

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
