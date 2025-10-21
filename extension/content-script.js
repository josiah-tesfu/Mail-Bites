"use strict";
(() => {
  // src/content/logger.ts
  var LOG_PREFIX = "[Mail Bites]";
  var logger = {
    info: (...payload) => console.info(LOG_PREFIX, ...payload),
    warn: (...payload) => console.warn(LOG_PREFIX, ...payload),
    error: (...payload) => console.error(LOG_PREFIX, ...payload)
  };

  // src/content/navigation.ts
  var listeners = /* @__PURE__ */ new Set();
  var patched = false;
  var originalPushState = null;
  var originalReplaceState = null;
  var boundNotify = null;
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
    const wrapHistoryMethod = (method) => {
      return function patchedHistoryMethod(...args) {
        const original = method === "pushState" ? originalPushState : originalReplaceState;
        if (original) {
          original(...args);
        }
        boundNotify?.();
      };
    };
    history.pushState = wrapHistoryMethod("pushState");
    history.replaceState = wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", boundNotify);
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
      window.removeEventListener("popstate", boundNotify);
    }
    patched = false;
    originalPushState = null;
    originalReplaceState = null;
    boundNotify = null;
  }
  function registerNavigationListener(listener) {
    if (listeners.size === 0) {
      ensurePatched();
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      teardownPatchesIfNeeded();
    };
  }

  // src/content/viewTracker.ts
  var GmailViewTracker = class {
    constructor(onViewChange, options) {
      this.onViewChange = onViewChange;
      this.debounceMs = options?.debounceMs ?? 50;
    }
    debounceMs;
    mutationObserver = null;
    unsubscribeNavigation = null;
    evaluationTimer = null;
    lastUrl = null;
    lastMainElement = null;
    started = false;
    /**
     * Starts monitoring Gmail for view changes. Calling this method multiple
     * times has no effect.
     */
    start() {
      if (this.started) {
        return;
      }
      this.started = true;
      this.unsubscribeNavigation = registerNavigationListener(
        () => this.scheduleEvaluate("history")
      );
      this.mutationObserver = new MutationObserver(
        () => this.scheduleEvaluate("mutation")
      );
      this.observeDocumentBody();
      this.scheduleEvaluate("initial");
      window.addEventListener("beforeunload", this.handleBeforeUnload);
    }
    /**
     * Stops monitoring Gmail and restores patched browser APIs.
     */
    stop() {
      if (!this.started) {
        return;
      }
      this.started = false;
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      if (this.unsubscribeNavigation) {
        this.unsubscribeNavigation();
        this.unsubscribeNavigation = null;
      }
      if (this.evaluationTimer !== null) {
        window.clearTimeout(this.evaluationTimer);
        this.evaluationTimer = null;
      }
      this.lastUrl = null;
      this.lastMainElement = null;
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
    }
    handleBeforeUnload = () => {
      this.stop();
    };
    /**
     * Ensures Gmail's `<body>` element is under observation. Gmail renders pages
     * incrementally, so the MutationObserver is (re)attached whenever a body
     * becomes available.
     */
    observeDocumentBody() {
      const { mutationObserver } = this;
      if (!mutationObserver) {
        return;
      }
      const observe = () => {
        const body = document.body;
        if (!body) {
          window.setTimeout(observe, this.debounceMs);
          return;
        }
        mutationObserver.observe(body, {
          childList: true,
          subtree: true
        });
      };
      observe();
    }
    /**
     * Schedules a view evaluation run. Rapid successive events are debounced.
     */
    scheduleEvaluate(reason) {
      if (this.evaluationTimer !== null) {
        return;
      }
      this.evaluationTimer = window.setTimeout(() => {
        this.evaluationTimer = null;
        this.evaluate(reason);
      }, this.debounceMs);
    }
    /**
     * Computes the current view context and invokes the consumer callback when
     * meaningful changes are detected.
     */
    evaluate(reason) {
      const currentUrl = window.location.href;
      const mainElement = document.querySelector('div[role="main"]');
      const urlChanged = this.lastUrl !== currentUrl;
      const mainChanged = this.lastMainElement !== mainElement;
      const shouldEmit = reason === "initial" || urlChanged || mainChanged || !mainElement;
      if (!shouldEmit) {
        logger.info("Skipped view refresh; no changes detected.");
        return;
      }
      this.lastUrl = currentUrl;
      this.lastMainElement = mainElement ?? null;
      const context = {
        url: currentUrl,
        hash: window.location.hash,
        path: window.location.pathname,
        timestamp: Date.now(),
        mainElement: mainElement ?? null
      };
      logger.info("Detected Gmail view update.", {
        reason,
        urlChanged,
        mainChanged,
        context
      });
      this.onViewChange(context);
    }
  };

  // src/content/ui/minimalInboxRenderer.ts
  var MinimalInboxRenderer = class {
    container = null;
    /**
     * Renders the overlay into the provided root. Repeated calls will re-render
     * the subject list based on the latest Gmail DOM state.
     */
    render(context, overlayRoot) {
      if (!context.mainElement) {
        logger.warn("MinimalInboxRenderer: Missing mainElement; skipping render.");
        return;
      }
      const subjects = this.collectSubjects(context.mainElement);
      logger.info("MinimalInboxRenderer: Rendering subjects.", {
        count: subjects.length,
        url: context.url
      });
      this.ensureContainer(overlayRoot);
      this.updateMarkup(subjects);
    }
    /**
     * Clears the overlay contents.
     */
    reset() {
      if (this.container) {
        this.container.innerHTML = "";
      }
    }
    ensureContainer(overlayRoot) {
      if (this.container && overlayRoot.contains(this.container)) {
        return;
      }
      const container = document.createElement("div");
      container.className = "mail-bites-inbox-list";
      overlayRoot.appendChild(container);
      this.container = container;
    }
    updateMarkup(subjects) {
      if (!this.container) {
        return;
      }
      if (subjects.length === 0) {
        this.container.innerHTML = '<p class="mail-bites-empty">No conversations detected in the Primary inbox.</p>';
        return;
      }
      const list = document.createElement("ul");
      list.className = "mail-bites-subjects";
      for (const subject of subjects) {
        const item = document.createElement("li");
        item.textContent = subject;
        list.appendChild(item);
      }
      this.container.innerHTML = "";
      this.container.appendChild(list);
    }
    /**
     * Navigates Gmail's inbox table structure to collect subject lines.
     */
    collectSubjects(mainElement) {
      const rows = Array.from(
        mainElement.querySelectorAll("tr.zA")
      );
      const subjects = rows.map((row) => {
        const subjectSpan = row.querySelector("span.bog");
        if (subjectSpan && subjectSpan.textContent) {
          return subjectSpan.textContent.trim();
        }
        const fallback = row.getAttribute("aria-label") ?? row.getAttribute("title") ?? "";
        return fallback.trim();
      }).filter((subject) => subject.length > 0);
      return subjects;
    }
  };

  // src/content/app.ts
  var MailBitesApp = class {
    rootId;
    tracker;
    rootElement = null;
    activeMainElement = null;
    lastContext = null;
    inboxRenderer = new MinimalInboxRenderer();
    constructor(options) {
      this.rootId = options?.rootId ?? "mail-bites-root";
      this.tracker = new GmailViewTracker((context) => this.handleViewChange(context));
    }
    /**
     * Begins observing Gmail and prepares the extension overlay.
     */
    start() {
      logger.info("Starting Mail Bites content script.");
      this.tracker.start();
    }
    /**
     * Shuts down observers and removes Mail Bites DOM artifacts.
     */
    stop() {
      logger.info("Stopping Mail Bites content script.");
      this.tracker.stop();
      this.detachOverlay();
    }
    /**
     * Ensures the overlay root exists and returns it so new UI can be mounted.
     */
    ensureOverlayRoot() {
      if (this.rootElement && document.body?.contains(this.rootElement)) {
        return this.rootElement;
      }
      const root = document.createElement("div");
      root.id = this.rootId;
      root.dataset.mailBites = "overlay";
      root.classList.add("mail-bites-overlay");
      document.body?.appendChild(root);
      this.rootElement = root;
      return root;
    }
    /**
     * Handles each Gmail view update. Future feature modules should plug into
     * this method (or the derived helpers) to redraw overlays.
     */
    handleViewChange(context) {
      this.lastContext = context;
      if (!context.mainElement) {
        logger.warn("Gmail main container is unavailable; deferring initialization.", context.url);
        return;
      }
      if (this.activeMainElement && this.activeMainElement !== context.mainElement) {
        this.teardownCurrentView();
      }
      this.activeMainElement = context.mainElement;
      const overlayRoot = this.ensureOverlayRoot();
      logger.info("Mail Bites ready for rendering.", {
        url: context.url,
        descriptor: context.hash || context.path
      });
      overlayRoot.innerHTML = "";
      this.inboxRenderer.render(context, overlayRoot);
    }
    /**
     * Removes Mail Bites specific DOM state while leaving Gmail untouched.
     */
    teardownCurrentView() {
      if (!this.activeMainElement) {
        return;
      }
      logger.info("Tearing down view bindings for previous Gmail context.");
      this.activeMainElement = null;
      this.inboxRenderer.reset();
    }
    /**
     * Removes overlay root to leave Gmail pristine (used on stop / extension reload).
     */
    detachOverlay() {
      if (this.rootElement && this.rootElement.parentElement) {
        this.rootElement.parentElement.removeChild(this.rootElement);
      }
      this.rootElement = null;
      this.inboxRenderer.reset();
    }
    /**
     * Exposes the last known Gmail context for debugging or testing hooks.
     */
    getCurrentContext() {
      return this.lastContext;
    }
  };

  // src/content/index.ts
  var app = new MailBitesApp();
  function bootstrap() {
    app.start();
    window.mailBites = { app };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
//# sourceMappingURL=content-script.js.map
