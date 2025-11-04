import { useCallback, useEffect, useRef } from 'react';

const COLLAPSE_TRANSITION_DURATION = 360;
const SEARCH_ROTATION_DURATION = 300;
const SEARCH_SHRINK_DELAY = 150;
const SEARCH_TRANSFORM_DELAY = SEARCH_ROTATION_DURATION;
const COMPOSE_ROTATE_CLOSE_CLASS = 'mail-bites-anim-rotate-close';
const COMPOSE_ROTATE_OPEN_CLASS = 'mail-bites-anim-rotate-open';
const BEZEL_PULSE_CLASS = 'mail-bites-anim-bezel-surface';
const SEARCH_ROTATE_CLASS = 'is-rotating';

type TimeoutHandle = number;

/**
 * React hook that mirrors the legacy AnimationController behaviors while
 * tracking all pending timeouts for automatic cleanup on unmount.
 */
export function useAnimations() {
  const timeoutsRef = useRef<Set<TimeoutHandle>>(new Set());

  const clearTimeoutHandle = useCallback((handle: TimeoutHandle) => {
    window.clearTimeout(handle);
    timeoutsRef.current.delete(handle);
  }, []);

  const scheduleTimeout = useCallback(
    (callback: () => void, delay: number): (() => void) => {
      const handle = window.setTimeout(() => {
        timeoutsRef.current.delete(handle);
        callback();
      }, delay);

      timeoutsRef.current.add(handle);
      return () => clearTimeoutHandle(handle);
    },
    [clearTimeoutHandle]
  );

  const cancelAll = useCallback(() => {
    for (const handle of timeoutsRef.current) {
      window.clearTimeout(handle);
    }
    timeoutsRef.current.clear();
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  const scheduleCollapseTimeout = useCallback(
    (callback: () => void, delay: number = COLLAPSE_TRANSITION_DURATION) =>
      scheduleTimeout(callback, delay),
    [scheduleTimeout]
  );

  const animateSearchTransform = useCallback(
    (
      button: HTMLButtonElement,
      onHalfway: () => void,
      onComplete: () => void
    ) => {
      button.classList.add(SEARCH_ROTATE_CLASS);

      scheduleTimeout(() => {
        onHalfway();
      }, SEARCH_SHRINK_DELAY);

      scheduleTimeout(() => {
        onComplete();
        button.classList.remove(SEARCH_ROTATE_CLASS);
      }, SEARCH_TRANSFORM_DELAY);
    },
    [scheduleTimeout]
  );

  const animateComposeRotation = useCallback(
    (
      button: HTMLButtonElement,
      direction: 'open' | 'close',
      onComplete: () => void
    ) => {
      const className =
        direction === 'close' ? COMPOSE_ROTATE_CLOSE_CLASS : COMPOSE_ROTATE_OPEN_CLASS;

      const handleAnimationEnd = () => {
        button.classList.remove(className);
        button.removeEventListener('animationend', handleAnimationEnd);
        onComplete();
      };

      button.classList.add(className);
      button.addEventListener('animationend', handleAnimationEnd, { once: true });
    },
    []
  );

  const animateBezelPulse = useCallback((element: HTMLElement) => {
    element.classList.remove(BEZEL_PULSE_CLASS);
    // Force reflow to restart animation
    void element.offsetWidth;
    element.classList.add(BEZEL_PULSE_CLASS);
  }, []);

  return {
    scheduleCollapseTimeout,
    animateSearchTransform,
    animateComposeRotation,
    animateBezelPulse,
    cancelAll
  } as const;
}

export const animationTimings = {
  COLLAPSE_TRANSITION_DURATION,
  SEARCH_ROTATION_DURATION,
  SEARCH_SHRINK_DELAY,
  SEARCH_TRANSFORM_DELAY
} as const;
