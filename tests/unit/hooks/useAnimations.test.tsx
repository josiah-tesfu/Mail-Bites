import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { StrictMode } from 'react';

import { useAnimations, animationTimings } from '@/content/hooks/useAnimations';

describe('useAnimations', () => {
  let container: HTMLDivElement;
  let root: Root;
  let hookValue: ReturnType<typeof useAnimations> | null = null;

  const TestComponent = () => {
    hookValue = useAnimations();
    return null;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <StrictMode>
          <TestComponent />
        </StrictMode>
      );
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
    hookValue = null;
  });

  it('schedules and cancels collapse timeouts', () => {
    const callback = vi.fn();
    const cancel = hookValue!.scheduleCollapseTimeout(callback, 1000);

    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();

    cancel();
    vi.advanceTimersByTime(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it('runs collapse callback when timeout completes', () => {
    const callback = vi.fn();
    hookValue!.scheduleCollapseTimeout(callback);

    vi.advanceTimersByTime(animationTimings.COLLAPSE_TRANSITION_DURATION);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('animates search transform with rotation class and callbacks', () => {
    const button = document.createElement('button');
    const halfway = vi.fn();
    const complete = vi.fn();

    hookValue!.animateSearchTransform(button, halfway, complete);

    expect(button.classList.contains('is-rotating')).toBe(true);

    vi.advanceTimersByTime(animationTimings.SEARCH_SHRINK_DELAY);
    expect(halfway).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(
      animationTimings.SEARCH_TRANSFORM_DELAY - animationTimings.SEARCH_SHRINK_DELAY
    );
    expect(complete).toHaveBeenCalledTimes(1);
    expect(button.classList.contains('is-rotating')).toBe(false);
  });

  it('animates compose rotation and invokes completion handler', () => {
    const button = document.createElement('button');
    const complete = vi.fn();

    hookValue!.animateComposeRotation(button, 'close', complete);
    expect(button.classList.contains('mail-bites-anim-rotate-close')).toBe(true);

    button.dispatchEvent(new Event('animationend'));

    expect(button.classList.contains('mail-bites-anim-rotate-close')).toBe(false);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('restarts bezel pulse animation', () => {
    const element = document.createElement('div');
    element.classList.add('mail-bites-anim-bezel-surface');

    hookValue!.animateBezelPulse(element);

    expect(element.classList.contains('mail-bites-anim-bezel-surface')).toBe(true);
  });

  it('cancels all pending timeouts on demand', () => {
    const callback = vi.fn();
    hookValue!.scheduleCollapseTimeout(callback, 5000);
    hookValue!.cancelAll();

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });
});
