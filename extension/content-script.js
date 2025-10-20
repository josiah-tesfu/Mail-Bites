(() => {
  'use strict';

  const LOG_PREFIX = '[Mail Bites]';
  const ROOT_ID = 'mail-bites-root';

  const state = {
    initialized: false,
    mainContainer: null,
    viewObserver: null,
    refreshScheduled: false
  };

  const log = (...args) => console.info(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);

  const findMainContainer = () => document.querySelector('div[role="main"]');

  const ensureRoot = () => {
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.dataset.mailBites = 'overlay';
    document.body.appendChild(root);
  };

  const cleanup = () => {
    // Placeholder: disconnect observers or remove injected UI when needed.
    state.initialized = false;
  };

  const onViewUpdated = (mainContainer) => {
    // Placeholder: respond to Gmail view changes (e.g., selected conversation).
    void mainContainer;
  };

  const initMailBites = (mainContainer) => {
    ensureRoot();

    if (!state.initialized) {
      state.initialized = true;
      log('Initialized on Gmail view.', { url: window.location.href });
    }

    state.mainContainer = mainContainer;
    onViewUpdated(mainContainer);
  };

  const refresh = () => {
    state.refreshScheduled = false;

    const mainContainer = findMainContainer();
    if (!mainContainer) {
      warn('Gmail main container not available yet.');
      return;
    }

    if (state.mainContainer && state.mainContainer !== mainContainer) {
      cleanup();
    }

    initMailBites(mainContainer);
  };

  const scheduleRefresh = () => {
    if (state.refreshScheduled) {
      return;
    }

    state.refreshScheduled = true;
    requestAnimationFrame(refresh);
  };

  const startObserving = () => {
    if (state.viewObserver) {
      return;
    }

    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    state.viewObserver = observer;
  };

  const bootstrap = () => {
    if (!document.body) {
      // Gmail injects the body later; retry shortly.
      window.setTimeout(bootstrap, 50);
      return;
    }

    startObserving();
    scheduleRefresh();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }

  window.addEventListener('beforeunload', () => {
    if (state.viewObserver) {
      state.viewObserver.disconnect();
    }
  });
})();
