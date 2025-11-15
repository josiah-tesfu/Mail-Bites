/**
 * Vitest global setup tailored for the Mail Bites content script.
 *
 * - Configures a minimal mock of Chrome extension APIs so unit tests can run
 *   without native browser bindings.
 * - Provides helper utilities that future tests can reuse.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

type ChromeEvent = chrome.events.Event<[(...args: unknown[]) => void]>;

const createEvent = (): ChromeEvent => {
  const listeners = new Set<(...args: unknown[]) => void>();

  const addListener = vi.fn((listener: (...args: unknown[]) => void) => {
    listeners.add(listener);
  });
  const removeListener = vi.fn((listener: (...args: unknown[]) => void) => {
    listeners.delete(listener);
  });
  const hasListener = vi.fn((listener: (...args: unknown[]) => void) =>
    listeners.has(listener)
  );

  // The real Chrome event is callable, but our tests only need the interface.
  return {
    addListener,
    removeListener,
    hasListener
  } as unknown as ChromeEvent;
};

const createStorageArea = (): chrome.storage.StorageArea => ({
  get: vi.fn((_keys?: string | string[] | Record<string, unknown>) =>
    Promise.resolve({})
  ),
  set: vi.fn((_items: Record<string, unknown>) => Promise.resolve()),
  remove: vi.fn((_keys: string | string[]) => Promise.resolve()),
  clear: vi.fn(() => Promise.resolve()),
  getBytesInUse: vi.fn((_keys?: string | string[]) => Promise.resolve(0))
});

if (!globalThis.chrome) {
  globalThis.chrome = {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: createEvent(),
      getURL: vi.fn((path: string) => `chrome-extension://mocked/${path}`)
    },
    storage: {
      local: createStorageArea(),
      sync: createStorageArea(),
      session: createStorageArea()
    }
  } as unknown as typeof chrome;
}

declare global {
  // eslint-disable-next-line no-var
  var chrome: typeof globalThis.chrome;
  // Flag consumed by React 18 to silence act() environment warnings.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

if (typeof globalThis.IS_REACT_ACT_ENVIRONMENT === 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}
