import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import ConversationList from './components/ConversationList/ConversationList';
import ComposerBox from './components/ComposerBox';
import CollapsedDraft from './components/ComposerBox/CollapsedDraft';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ensureManropeFont } from './fontLoader';
import { logger } from './logger';
import { useGmailConversations } from './hooks/useGmailConversations';
import { useMainElementReset } from './hooks/useMainElementReset';
import { useClickOutside, type UseClickOutsideShouldHandleArgs } from './hooks/useClickOutside';
import { resetComposerStore, resetConversationStore, resetToolbarStore, useComposerStore, useConversationStore } from './store';
import type { ComposerActionType } from './ui/types/actionTypes';
import type { ConversationData } from './ui/conversationParser';
import { GmailViewTracker, type ViewContext } from './viewTracker';
import { animationTimings } from './hooks/useAnimations';

const ROOT_ID = 'mail-bites-root';

declare global {
  interface Window {
    mailBites?: {
      mount: () => void;
      unmount: () => void;
    };
  }
}

let root: Root | null = null;
let hostElement: HTMLElement | null = null;

const MailBitesApp = ({ host }: { host: HTMLElement }) => {
  const hasWarnedMissingMainRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);

  // Store subscriptions for standalone compose boxes
  const composeBoxCount = useComposerStore((state) => state.composeBoxCount);
  const composeDrafts = useComposerStore((state) => state.composeDrafts);
  const expandedComposeIndex = useComposerStore((state) => state.expandedComposeIndex);
  const setExpandedComposeIndex = useComposerStore((state) => state.setExpandedComposeIndex);
  const removeComposeBox = useComposerStore((state) => state.removeComposeBox);
  const sendEmail = useComposerStore((state) => state.sendEmail);
  const saveDraft = useComposerStore((state) => state.saveDraft);

  useGmailConversations(viewContext);
  useMainElementReset(viewContext);

  useEffect(() => {
    ensureManropeFont();
  }, []);

  useEffect(() => {
    if (!document.head || !chrome?.runtime?.getURL) {
      return;
    }

    const iconUrl = chrome.runtime.getURL('leaf-logo.png');
    const rels = ['icon', 'shortcut icon'];
    const createdLinks: HTMLLinkElement[] = [];
    const previousHrefs = new Map<HTMLLinkElement, string>();

    rels.forEach((rel) => {
      let link = document.head!.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        link.type = 'image/png';
        document.head!.appendChild(link);
        createdLinks.push(link);
      } else {
        previousHrefs.set(link, link.href);
      }
      link.href = iconUrl;
    });

    return () => {
      createdLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });

      previousHrefs.forEach((href, link) => {
        link.href = href;
      });
    };
  }, []);

  useEffect(() => {
    const tracker = new GmailViewTracker((context) => {
      setViewContext(context);
      setOverlayVisible(Boolean(context.mainElement));

      if (!context.mainElement) {
        if (!hasWarnedMissingMainRef.current) {
          logger.warn(
            'Gmail main container is unavailable; deferring initialization.',
            context.url
          );
          hasWarnedMissingMainRef.current = true;
        }
        return;
      }

      hasWarnedMissingMainRef.current = false;
      logger.info('Mail Bites ready for rendering.', {
        url: context.url,
        descriptor: context.hash || context.path
      });
    });

    tracker.start();

    return () => {
      tracker.stop();
    };
  }, []);

  useEffect(() => {
    host.style.display = isOverlayVisible ? 'block' : 'none';
  }, [host, isOverlayVisible]);

  const collapseComposerWithAnimation = useCallback((composeIndex: number, onComplete: () => void) => {
    const composerSelector = `.mail-bites-response-box[data-compose-index="${composeIndex}"]`;
    const composerElement = document.querySelector<HTMLElement>(composerSelector);

    if (!composerElement) {
      onComplete();
      return;
    }

    const collapsingClass = 'is-collapsing';
    const duration = animationTimings.COLLAPSE_TRANSITION_DURATION;
    const height = composerElement.getBoundingClientRect().height;
    const previousHeight = composerElement.style.height;
    const previousOverflow = composerElement.style.overflow;

    composerElement.style.height = `${height}px`;
    composerElement.style.overflow = 'hidden';

    let hasCompleted = false;
    let fallbackId: number | null = null;

    const cleanup = () => {
      if (fallbackId !== null) {
        window.clearTimeout(fallbackId);
        fallbackId = null;
      }
      composerElement.removeEventListener('transitionend', handleTransitionEnd);
      composerElement.classList.remove(collapsingClass);
      composerElement.style.removeProperty('pointer-events');
      composerElement.style.height = previousHeight;
      composerElement.style.overflow = previousOverflow;
    };

    const complete = () => {
      if (hasCompleted) {
        return;
      }
      hasCompleted = true;
      cleanup();
      onComplete();
    };

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== composerElement || event.propertyName !== 'height') {
        return;
      }
      complete();
    };

    composerElement.style.pointerEvents = 'none';
    composerElement.classList.add(collapsingClass);
    requestAnimationFrame(() => {
      composerElement.style.height = '0px';
    });

    composerElement.addEventListener('transitionend', handleTransitionEnd);
    fallbackId = window.setTimeout(complete, duration);
  }, []);

  // Handle standalone compose box actions
  const handleStandaloneComposerAction = useCallback((
    type: ComposerActionType,
    conversation: ConversationData | null,
    composeIndex?: number
  ) => {
    if (composeIndex === undefined) {
      logger.warn('Standalone composer action missing compose index', type);
      return;
    }

    if (type === 'close') {
      if (expandedComposeIndex === composeIndex) {
        setExpandedComposeIndex(null);
      }
      logger.info('Draft collapsed.', { composeIndex });
      return;
    }

    if (type === 'delete') {
      const draft = composeDrafts.get(composeIndex);
      if (draft) {
        saveDraft(composeIndex, draft);
      }
      removeComposeBox(composeIndex);
      logger.info('Draft closed and archived.', { composeIndex });
      return;
    }

    if (type === 'send') {
      sendEmail(composeIndex);
      logger.info('Draft marked as sent.', { composeIndex });
      collapseComposerWithAnimation(composeIndex, () => {
        removeComposeBox(composeIndex, { archive: false });
      });
      return;
    }

    logger.info('Standalone composer action not implemented:', type, composeIndex);
  }, [collapseComposerWithAnimation, composeDrafts, expandedComposeIndex, removeComposeBox, saveDraft, sendEmail, setExpandedComposeIndex]);

  // Handle compose box click to expand
  const handleComposeBoxClick = useCallback((index: number) => {
    if (expandedComposeIndex === index) {
      setExpandedComposeIndex(null);
    } else {
      setExpandedComposeIndex(index);
    }
  }, [expandedComposeIndex, setExpandedComposeIndex]);

  const handleGlobalDismiss = useCallback(() => {
    const conversationStore = useConversationStore.getState();

    if (expandedComposeIndex !== null) {
      logger.info('Collapsing compose box via click-outside', { expandedComposeIndex });
      setExpandedComposeIndex(null);
    }

    const currentExpandedId = conversationStore.expandedId;

    // Close any inline reply/forward composers by collapsing them if a draft exists;
    // otherwise revert them to read mode.
    conversationStore.conversationModes.forEach((mode, conversationId) => {
      if (mode !== 'read') {
        if (conversationStore.inlineDrafts.has(conversationId)) {
          conversationStore.setInlineComposerCollapsed(conversationId, true);
        } else {
          conversationStore.setConversationMode(conversationId, 'read');
        }
      }
    });

    if (currentExpandedId) {
      logger.info('Collapsing conversation via click-outside', { expandedId: currentExpandedId });
      conversationStore.collapseConversation(currentExpandedId);
      conversationStore.setHighlightedId(null);
      conversationStore.removeHoveredId(currentExpandedId);
    }
  }, [expandedComposeIndex, setExpandedComposeIndex]);

  const shouldHandleClickOutside = useCallback(({ target, mouseDownTarget }: UseClickOutsideShouldHandleArgs) => {
    const interactedWithConversation = (element: HTMLElement | null) =>
      Boolean(element?.closest('.mail-bites-item'));
    const interactedWithComposer = (element: HTMLElement | null) =>
      Boolean(element?.closest('.mail-bites-response-box'));

    if (
      interactedWithConversation(target) ||
      interactedWithConversation(mouseDownTarget) ||
      interactedWithComposer(target) ||
      interactedWithComposer(mouseDownTarget)
    ) {
      return false;
    }

    return true;
  }, []);

  useClickOutside(overlayRef, handleGlobalDismiss, {
    isEnabled: isOverlayVisible,
    shouldHandle: shouldHandleClickOutside
  });

  useEffect(() => {
    return () => {
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
      host.style.display = 'none';
    };
  }, [host]);

  return (
    <div
      ref={overlayRef}
      className="mail-bites-overlay"
      data-mail-bites="overlay"
      aria-hidden={!isOverlayVisible}
    >
      {isOverlayVisible && (
        <>
          <Toolbar />
          <ConversationList 
            composeBoxes={composeDrafts.size > 0 ? (
              Array.from(composeDrafts.entries())
                .sort((a, b) => b[0] - a[0])
                .map(([composeIndex, draft]) => {
                  const isExpanded = expandedComposeIndex === composeIndex;

                  if (isExpanded) {
                    return (
                      <ComposerBox
                        key={composeIndex}
                        conversation={null}
                        mode="compose"
                        composeIndex={composeIndex}
                        isExpanded
                        draft={draft}
                        onAction={handleStandaloneComposerAction}
                      />
                    );
                  }

                  return (
                    <div
                      key={composeIndex}
                      className="mail-bites-response-box mail-bites-response-box--collapsed mail-bites-item mail-bites-card mail-bites-card--collapsed"
                      data-compose-index={composeIndex}
                      data-response-mode="compose"
                      onClick={() => setExpandedComposeIndex(composeIndex)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setExpandedComposeIndex(composeIndex);
                        }
                      }}
                    >
                      <CollapsedDraft
                        recipient={draft?.to || ''}
                        subject={draft?.subject || ''}
                        timestamp={draft?.timestamp || Date.now()}
                        onDelete={() => handleStandaloneComposerAction('delete', null, composeIndex)}
                      />
                    </div>
                  );
                })
            ) : undefined}
          />
        </>
      )}
    </div>
  );
};

const unmount = () => {
  if (root) {
    root.unmount();
    root = null;
  }

  const host = hostElement ?? document.getElementById(ROOT_ID);
  if (host && host.parentElement) {
    host.parentElement.removeChild(host);
  }

  hostElement = null;
};

const ensureOverlayHost = (): HTMLElement => {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLElement) {
    existing.dataset.mailBites = 'overlay';
    existing.classList.add('mail-bites-overlay');
    if (!existing.style.display) {
      existing.style.display = 'none';
    }
    return existing;
  }

  const element = document.createElement('div');
  element.id = ROOT_ID;
  element.dataset.mailBites = 'overlay';
  element.className = 'mail-bites-overlay';
  element.style.display = 'none';
  document.body?.appendChild(element);
  return element;
};

const mount = () => {
  hostElement = ensureOverlayHost();

  if (!root) {
    root = createRoot(hostElement);
  }

  root.render(
    <StrictMode>
      <MailBitesApp host={hostElement} />
    </StrictMode>
  );
};

const bootstrap = () => {
  mount();
};

window.mailBites = {
  mount,
  unmount
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
