import { logger } from './logger';
import { GmailViewTracker, ViewContext } from './viewTracker';
import { MinimalInboxRenderer } from './ui/minimalInboxRenderer';
import { ensureManropeFont } from './fontLoader';

export interface MailBitesAppOptions {
  /**
   * Element id used for the overlay wrapper that Mail Bites injects into Gmail.
   */
  rootId?: string;
}

/**
 * Coordinates the lifecycle of the Mail Bites content script. The class owns
 * the Gmail view tracker and exposes hooks where future features (minimalist UI
 * overhaul, AI summaries, etc.) will attach.
 */
export class MailBitesApp {
  private readonly rootId: string;
  private readonly tracker: GmailViewTracker;
  private rootElement: HTMLDivElement | null = null;
  private activeMainElement: HTMLElement | null = null;
  private lastContext: ViewContext | null = null;
  private readonly inboxRenderer = new MinimalInboxRenderer();

  constructor(options?: MailBitesAppOptions) {
    this.rootId = options?.rootId ?? 'mail-bites-root';
    this.tracker = new GmailViewTracker((context) => this.handleViewChange(context));
  }

  /**
   * Begins observing Gmail and prepares the extension overlay.
   */
  start(): void {
    logger.info('Starting Mail Bites content script.');
    this.tracker.start();
  }

  /**
   * Shuts down observers and removes Mail Bites DOM artifacts.
   */
  stop(): void {
    logger.info('Stopping Mail Bites content script.');
    this.tracker.stop();
    this.detachOverlay();
  }

  /**
   * Ensures the overlay root exists and returns it so new UI can be mounted.
   */
  private ensureOverlayRoot(): HTMLDivElement {
    if (this.rootElement && document.body?.contains(this.rootElement)) {
      return this.rootElement;
    }

    ensureManropeFont();

    const root = document.createElement('div');
    root.id = this.rootId;
    root.dataset.mailBites = 'overlay';
    root.classList.add('mail-bites-overlay');
    document.body?.appendChild(root);
    this.rootElement = root;
    return root;
  }

  /**
   * Handles each Gmail view update. Future feature modules should plug into
   * this method (or the derived helpers) to redraw overlays.
   */
  private handleViewChange(context: ViewContext): void {
    this.lastContext = context;

    if (!context.mainElement) {
      logger.warn('Gmail main container is unavailable; deferring initialization.', context.url);
      return;
    }

    if (this.activeMainElement && this.activeMainElement !== context.mainElement) {
      this.teardownCurrentView();
    }

    this.activeMainElement = context.mainElement;
    const overlayRoot = this.ensureOverlayRoot();

    logger.info('Mail Bites ready for rendering.', {
      url: context.url,
      descriptor: context.hash || context.path
    });

    overlayRoot.innerHTML = '';
    this.inboxRenderer.render(context, overlayRoot);
  }

  /**
   * Removes Mail Bites specific DOM state while leaving Gmail untouched.
   */
  private teardownCurrentView(): void {
    if (!this.activeMainElement) {
      return;
    }

    logger.info('Tearing down view bindings for previous Gmail context.');
    this.activeMainElement = null;
    this.inboxRenderer.reset();
  }

  /**
   * Removes overlay root to leave Gmail pristine (used on stop / extension reload).
   */
  private detachOverlay(): void {
    if (this.rootElement && this.rootElement.parentElement) {
      this.rootElement.parentElement.removeChild(this.rootElement);
    }
    this.rootElement = null;
    this.inboxRenderer.reset();
  }

  /**
   * Exposes the last known Gmail context for debugging or testing hooks.
   */
  getCurrentContext(): ViewContext | null {
    return this.lastContext;
  }
}
