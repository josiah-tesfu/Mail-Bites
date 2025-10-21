/**
 * Navigation utilities tailored for Gmail's single-page-app routing.
 *
 * Gmail mutates the current document via `history.pushState` and
 * `history.replaceState` without full page reloads. We patch these methods so
 * that Mail Bites can be notified whenever the user navigates between inbox,
 * search results, or individual conversations.
 */

type NavigationListener = (url: string) => void;

const listeners = new Set<NavigationListener>();

let patched = false;
let originalPushState: History['pushState'] | null = null;
let originalReplaceState: History['replaceState'] | null = null;
let boundNotify: (() => void) | null = null;

/**
 * Notifies all registered listeners that a navigation event occurred.
 * The callback is queued in a microtask so that document mutations have a
 * chance to run before listeners inspect the DOM.
 */
function notifyListeners() {
  const href = window.location.href;
  queueMicrotask(() => {
    for (const listener of Array.from(listeners)) {
      listener(href);
    }
  });
}

function ensurePatched() {
  if (patched) {
    return;
  }

  patched = true;
  originalPushState = history.pushState.bind(history);
  originalReplaceState = history.replaceState.bind(history);
  boundNotify = notifyListeners;

  const wrapHistoryMethod = <T extends keyof History>(method: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function patchedHistoryMethod(this: History, ...args: any[]) {
      const original =
        method === 'pushState' ? originalPushState : originalReplaceState;
      if (original) {
        original(...args);
      }
      boundNotify?.();
    };
  };

  history.pushState = wrapHistoryMethod('pushState');
  history.replaceState = wrapHistoryMethod('replaceState');
  window.addEventListener('popstate', boundNotify);
}

function teardownPatchesIfNeeded() {
  if (!patched || listeners.size > 0) {
    return;
  }

  if (originalPushState) {
    history.pushState = originalPushState;
  }

  if (originalReplaceState) {
    history.replaceState = originalReplaceState;
  }

  if (boundNotify) {
    window.removeEventListener('popstate', boundNotify);
  }

  patched = false;
  originalPushState = null;
  originalReplaceState = null;
  boundNotify = null;
}

/**
 * Registers a navigation listener. The callback is invoked whenever Gmail
 * changes its SPA view through the History API.
 *
 * The returned function can be invoked to unregister the listener.
 */
export function registerNavigationListener(
  listener: NavigationListener
): () => void {
  if (listeners.size === 0) {
    ensurePatched();
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    teardownPatchesIfNeeded();
  };
}
