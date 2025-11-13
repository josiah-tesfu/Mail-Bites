import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import ConversationList from './components/ConversationList/ConversationList';
import ComposerBox from './components/ComposerBox';
import { Toolbar } from './components/Toolbar/Toolbar';
import { ensureManropeFont } from './fontLoader';
import { logger } from './logger';
import { useGmailConversations } from './hooks/useGmailConversations';
import { resetComposerStore, resetConversationStore, resetToolbarStore, useComposerStore, useConversationStore } from './store';
import type { ComposerActionType } from './ui/types/actionTypes';
import type { ConversationData } from './ui/conversationParser';
import { GmailViewTracker, type ViewContext } from './viewTracker';

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
  const activeMainElementRef = useRef<HTMLElement | null>(null);
  const hasWarnedMissingMainRef = useRef(false);
  const mouseDownTargetRef = useRef<HTMLElement | null>(null);
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const [mainElement, setMainElement] = useState<HTMLElement | null>(null);
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

  useEffect(() => {
    ensureManropeFont();
  }, []);

  useEffect(() => {
    const tracker = new GmailViewTracker((context) => {
      setViewContext(context);
      setMainElement(context.mainElement ?? null);
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
      removeComposeBox(composeIndex, { archive: false });
      logger.info('Draft marked as sent.', { composeIndex });
      return;
    }

    logger.info('Standalone composer action not implemented:', type, composeIndex);
  }, [composeDrafts, removeComposeBox, saveDraft, sendEmail]);

  // Handle compose box click to expand
  const handleComposeBoxClick = useCallback((index: number) => {
    if (expandedComposeIndex === index) {
      setExpandedComposeIndex(null);
    } else {
      setExpandedComposeIndex(index);
    }
  }, [expandedComposeIndex, setExpandedComposeIndex]);

  // Click-outside handler to collapse expanded conversations
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const mouseDownInConversation = mouseDownTargetRef.current?.closest('.mail-bites-item');
    const mouseDownInComposer = mouseDownTargetRef.current?.closest('.mail-bites-response-box');

    if (mouseDownInConversation || mouseDownInComposer) {
      return;
    }

    const clickedConversation = target.closest('.mail-bites-item');
    const clickedComposer = target.closest('.mail-bites-response-box');

    if (clickedConversation || clickedComposer) {
      return;
    }

    const conversationStore = useConversationStore.getState();
    if (conversationStore.expandedId) {
      logger.info('Collapsing conversation via click-outside', { expandedId: conversationStore.expandedId });
      conversationStore.collapseConversation(conversationStore.expandedId);
      conversationStore.setHighlightedId(null);
    }

    if (expandedComposeIndex !== null) {
      logger.info('Collapsing compose box via click-outside', { expandedComposeIndex });
      setExpandedComposeIndex(null);
    }
  }, [expandedComposeIndex, setExpandedComposeIndex]);

  useEffect(() => {
    if (!isOverlayVisible) return;
    
    const handleMouseDown = (event: MouseEvent) => {
      mouseDownTargetRef.current = event.target as HTMLElement;
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOverlayVisible, handleClickOutside]);

  useEffect(() => {
    if (!viewContext || !viewContext.mainElement) {
      activeMainElementRef.current = null;
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
      return;
    }

    const previousMain = activeMainElementRef.current;
    const currentMain = viewContext.mainElement;

    if (previousMain && previousMain !== currentMain) {
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
    }

    activeMainElementRef.current = currentMain;
  }, [mainElement, viewContext]);

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
      className="mail-bites-overlay"
      data-mail-bites="overlay"
      aria-hidden={!isOverlayVisible}
    >
      {isOverlayVisible && (
        <>
          <Toolbar />
          <ConversationList 
            composeBoxes={composeBoxCount > 0 ? (
              Array.from({ length: composeBoxCount }, (_, index) => {
                const draft = composeDrafts.get(index);
                const isExpanded = expandedComposeIndex === index;
                
                return (
                  <div
                    key={index}
                    onClick={() => !isExpanded && handleComposeBoxClick(index)}
                    style={{ cursor: !isExpanded ? 'pointer' : 'auto' }}
                  >
                    <ComposerBox
                      conversation={null}
                      mode="compose"
                      composeIndex={index}
                      isExpanded={isExpanded}
                      draft={draft}
                      onAction={handleStandaloneComposerAction}
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
