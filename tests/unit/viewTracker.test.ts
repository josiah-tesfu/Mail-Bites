import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/content/navigation', () => ({
  registerNavigationListener: vi.fn(() => vi.fn())
}));

import { GmailViewTracker } from '@/content/viewTracker';

describe('GmailViewTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    const main = document.createElement('div');
    main.setAttribute('role', 'main');
    document.body.appendChild(main);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('emits view updates when the DOM mutates without navigation', async () => {
    const handler = vi.fn();
    const tracker = new GmailViewTracker(handler);

    tracker.start();

    // Flush initial evaluation
    await vi.advanceTimersByTimeAsync(60);
    expect(handler).toHaveBeenCalledTimes(1);

    // Mutate DOM without changing URL or main element
    const marker = document.createElement('div');
    document.body.appendChild(marker);

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(60);

    expect(handler).toHaveBeenCalledTimes(2);

    const initialContext = handler.mock.calls[0][0];
    const mutationContext = handler.mock.calls[1][0];
    expect(initialContext.url).toBe(mutationContext.url);
    expect(initialContext.mainElement).toBe(mutationContext.mainElement);

    tracker.stop();
  });
});
