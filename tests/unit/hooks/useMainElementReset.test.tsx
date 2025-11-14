import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('@/content/store', async () => {
  const actual = await vi.importActual<typeof import('@/content/store')>('@/content/store');
  return {
    ...actual,
    resetConversationStore: vi.fn(),
    resetToolbarStore: vi.fn(),
    resetComposerStore: vi.fn()
  };
});

import { resetComposerStore, resetConversationStore, resetToolbarStore } from '@/content/store';
import type { ViewContext } from '@/content/viewTracker';
import { useMainElementReset } from '@/content/hooks/useMainElementReset';

const createContext = (main: HTMLElement | null): ViewContext | null => {
  if (!main) {
    return null;
  }
  return {
    mainElement: main,
    url: 'https://mail.google.com/mail/u/0/#inbox',
    hash: '#inbox',
    path: '/mail/u/0/',
    timestamp: Date.now()
  };
};

const TestComponent = ({ ctx }: { ctx: ViewContext | null }) => {
  useMainElementReset(ctx);
  return null;
};

describe('useMainElementReset', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(resetConversationStore).mockClear();
    vi.mocked(resetToolbarStore).mockClear();
    vi.mocked(resetComposerStore).mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('does not reset when Gmail temporarily removes the main element', () => {
    const main = document.createElement('div');

    act(() => {
      root.render(<TestComponent ctx={createContext(main)} />);
    });

    expect(resetConversationStore).not.toHaveBeenCalled();

    act(() => {
      root.render(<TestComponent ctx={null} />);
    });

    expect(resetConversationStore).not.toHaveBeenCalled();

    act(() => {
      root.render(<TestComponent ctx={createContext(main)} />);
    });

    expect(resetConversationStore).not.toHaveBeenCalled();
    expect(resetToolbarStore).not.toHaveBeenCalled();
    expect(resetComposerStore).not.toHaveBeenCalled();
  });

  it('resets stores when Gmail swaps to a different main element', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');

    act(() => {
      root.render(<TestComponent ctx={createContext(first)} />);
    });

    expect(resetConversationStore).not.toHaveBeenCalled();

    act(() => {
      root.render(<TestComponent ctx={createContext(second)} />);
    });

    expect(resetConversationStore).toHaveBeenCalledTimes(1);
    expect(resetToolbarStore).toHaveBeenCalledTimes(1);
    expect(resetComposerStore).toHaveBeenCalledTimes(1);
  });
});
