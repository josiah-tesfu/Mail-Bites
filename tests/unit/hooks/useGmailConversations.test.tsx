import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('@/content/gmail/syncConversations', () => ({
  syncConversations: vi.fn()
}));

import { syncConversations } from '@/content/gmail/syncConversations';
import type { ViewContext } from '@/content/viewTracker';
import { useGmailConversations } from '@/content/hooks/useGmailConversations';

const createContext = (mainElement: HTMLElement | null): ViewContext | null => {
  if (!mainElement) return null;
  return {
    mainElement,
    url: 'https://mail.google.com/mail/u/0/#inbox',
    hash: '#inbox',
    path: '/mail/u/0/',
    timestamp: Date.now()
  };
};

const TestComponent = ({ ctx }: { ctx: ViewContext | null }) => {
  useGmailConversations(ctx);
  return null;
};

describe('useGmailConversations', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(syncConversations).mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('throttles sync calls when Gmail mutates the main container', async () => {
    const main = document.createElement('div');
    document.body.appendChild(main);

    const context = createContext(main);

    act(() => {
      root.render(<TestComponent ctx={context} />);
    });

    expect(syncConversations).toHaveBeenCalledTimes(1);
    expect(syncConversations).toHaveBeenLastCalledWith(context);

    const child = document.createElement('span');
    main.appendChild(child);
    await Promise.resolve();

    expect(syncConversations).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);
    expect(syncConversations).toHaveBeenCalledTimes(2);

    main.remove();
  });

  it('resets conversations immediately when context is null', () => {
    const main = document.createElement('div');
    document.body.appendChild(main);
    const context = createContext(main);

    act(() => {
      root.render(<TestComponent ctx={context} />);
    });

    expect(syncConversations).toHaveBeenCalledTimes(1);

    act(() => {
      root.render(<TestComponent ctx={null} />);
    });

    expect(syncConversations).toHaveBeenCalledTimes(2);
    expect(syncConversations).toHaveBeenLastCalledWith(null);

    main.remove();
  });
});
