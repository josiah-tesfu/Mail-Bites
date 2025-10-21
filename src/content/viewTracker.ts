import { logger } from './logger';
import { registerNavigationListener } from './navigation';

/**
 * Context information that describes the current Gmail view.
 */
export interface ViewContext {
  /**
   * Absolute URL (including hash) corresponding to the SPA route.
   */
  url: string;
  /**
   * Hash fragment used by Gmail to encode mailbox, search, or conversation IDs.
   */
  hash: string;
  /**
   * The document pathname for reference (typically `/mail/u/0/`).
   */
  path: string;
  /**
   * Timestamp when the context snapshot was produced.
   */
  timestamp: number;
  /**
   * Gmail's primary content container (usually `div[role="main"]`).
   */
  mainElement: HTMLElement | null;
}

export type ViewChangeHandler = (context: ViewContext) => void;

export interface GmailViewTrackerOptions {
  /**
   * Minimum delay between DOM mutation events and the next evaluation cycle.
   * Keeping this value low ensures the content script reacts quickly without
   * thrashing while Gmail renders.
   */
  debounceMs?: number;
}

/**
 * Observes Gmail's SPA navigation and DOM mutations to decide when Mail Bites
 * should refresh its UI. The class patches the History API (via
 * `registerNavigationListener`) and couples it with a MutationObserver to cover
 * both URL-driven and in-place DOM refreshes.
 */
export class GmailViewTracker {
  private readonly debounceMs: number;
  private mutationObserver: MutationObserver | null = null;
  private unsubscribeNavigation: (() => void) | null = null;
  private evaluationTimer: number | null = null;
  private lastUrl: string | null = null;
  private lastMainElement: HTMLElement | null = null;
  private started = false;

  constructor(
    private readonly onViewChange: ViewChangeHandler,
    options?: GmailViewTrackerOptions
  ) {
    this.debounceMs = options?.debounceMs ?? 50;
  }

  /**
   * Starts monitoring Gmail for view changes. Calling this method multiple
   * times has no effect.
   */
  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.unsubscribeNavigation = registerNavigationListener(() =>
      this.scheduleEvaluate('history')
    );

    this.mutationObserver = new MutationObserver(() =>
      this.scheduleEvaluate('mutation')
    );

    this.observeDocumentBody();
    this.scheduleEvaluate('initial');

    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Stops monitoring Gmail and restores patched browser APIs.
   */
  stop(): void {
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

    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleBeforeUnload = () => {
    this.stop();
  };

  /**
   * Ensures Gmail's `<body>` element is under observation. Gmail renders pages
   * incrementally, so the MutationObserver is (re)attached whenever a body
   * becomes available.
   */
  private observeDocumentBody(): void {
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
  private scheduleEvaluate(reason: 'history' | 'mutation' | 'initial'): void {
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
  private evaluate(reason: 'history' | 'mutation' | 'initial'): void {
    const currentUrl = window.location.href;
    const mainElement = document.querySelector<HTMLElement>('div[role="main"]');
    const urlChanged = this.lastUrl !== currentUrl;
    const mainChanged = this.lastMainElement !== mainElement;
    const shouldEmit =
      reason === 'initial' || urlChanged || mainChanged || !mainElement;

    if (!shouldEmit) {
      logger.info('Skipped view refresh; no changes detected.');
      return;
    }

    this.lastUrl = currentUrl;
    this.lastMainElement = mainElement ?? null;

    const context: ViewContext = {
      url: currentUrl,
      hash: window.location.hash,
      path: window.location.pathname,
      timestamp: Date.now(),
      mainElement: mainElement ?? null
    };

    logger.info('Detected Gmail view update.', {
      reason,
      urlChanged,
      mainChanged,
      context
    });

    this.onViewChange(context);
  }
}
